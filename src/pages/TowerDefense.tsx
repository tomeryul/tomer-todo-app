import { useEffect, useRef, useState, useCallback } from 'react';

// =============================================================
// Babies vs Monsters — Tower Defense
// Babies defend, Monsters attack. Place babies along the path
// to stop monsters from reaching the crib.
// =============================================================

const TILE = 48;
const COLS = 16;
const ROWS = 10;
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

// Grid path (in tile coordinates). Monsters walk from first to last.
const PATH_CELLS: Array<[number, number]> = [
  [-1, 2],
  [3, 2],
  [3, 6],
  [8, 6],
  [8, 2],
  [12, 2],
  [12, 7],
  [16, 7],
];

// Convert cell coords to pixel center.
const cellCenter = (cx: number, cy: number) => ({
  x: cx * TILE + TILE / 2,
  y: cy * TILE + TILE / 2,
});

// Waypoints in pixel space.
const WAYPOINTS = PATH_CELLS.map(([c, r]) => cellCenter(c, r));

// Compute set of tiles the path covers so we can't build on them.
const pathTiles = new Set<string>();
for (let i = 0; i < PATH_CELLS.length - 1; i++) {
  const [ax, ay] = PATH_CELLS[i];
  const [bx, by] = PATH_CELLS[i + 1];
  if (ax === bx) {
    const [lo, hi] = ay < by ? [ay, by] : [by, ay];
    for (let y = lo; y <= hi; y++) pathTiles.add(`${ax},${y}`);
  } else {
    const [lo, hi] = ax < bx ? [ax, bx] : [bx, ax];
    for (let x = lo; x <= hi; x++) pathTiles.add(`${x},${ay}`);
  }
}

type BabyKind = 'bottle' | 'rattle' | 'pacifier';

interface BabyType {
  key: BabyKind;
  name: string;
  emoji: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // shots per second
  projectile: string;
  color: string;
}

const BABY_TYPES: Record<BabyKind, BabyType> = {
  bottle: {
    key: 'bottle',
    name: 'תינוק בקבוק',
    emoji: '👶',
    cost: 50,
    range: 110,
    damage: 10,
    fireRate: 1.5,
    projectile: '🍼',
    color: '#60a5fa',
  },
  rattle: {
    key: 'rattle',
    name: 'תינוק רעשן',
    emoji: '🍼',
    cost: 100,
    range: 140,
    damage: 18,
    fireRate: 2.2,
    projectile: '🎵',
    color: '#f472b6',
  },
  pacifier: {
    key: 'pacifier',
    name: 'תינוק מוצץ',
    emoji: '🧸',
    cost: 175,
    range: 170,
    damage: 40,
    fireRate: 0.9,
    projectile: '💥',
    color: '#facc15',
  },
};

interface Baby {
  id: number;
  type: BabyKind;
  cx: number; // tile
  cy: number;
  x: number; // pixel center
  y: number;
  cooldown: number;
}

interface Monster {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number; // px/s
  bounty: number;
  damage: number;
  emoji: string;
  segment: number; // index of next waypoint
  color: string;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
  emoji: string;
}

interface MonsterTemplate {
  emoji: string;
  hp: number;
  speed: number;
  bounty: number;
  color: string;
}

const MONSTERS: MonsterTemplate[] = [
  { emoji: '👹', hp: 40, speed: 50, bounty: 10, color: '#ef4444' },
  { emoji: '👺', hp: 70, speed: 60, bounty: 14, color: '#f97316' },
  { emoji: '👻', hp: 55, speed: 85, bounty: 16, color: '#a78bfa' },
  { emoji: '🧟', hp: 140, speed: 40, bounty: 22, color: '#22c55e' },
  { emoji: '🐉', hp: 320, speed: 55, bounty: 60, color: '#dc2626' },
];

interface Wave {
  monsters: Array<{ template: number; count: number; hpMul: number; interval: number }>;
}

const buildWave = (n: number): Wave => {
  const hpMul = 1 + (n - 1) * 0.25;
  const base = 6 + n * 2;
  const groups: Wave['monsters'] = [
    { template: 0, count: base, hpMul, interval: 0.8 },
  ];
  if (n >= 2) groups.push({ template: 1, count: Math.floor(base * 0.6), hpMul, interval: 0.9 });
  if (n >= 3) groups.push({ template: 2, count: Math.floor(base * 0.5), hpMul, interval: 0.6 });
  if (n >= 5) groups.push({ template: 3, count: Math.floor(base * 0.4), hpMul, interval: 1.1 });
  if (n % 5 === 0) groups.push({ template: 4, count: 1 + Math.floor(n / 5), hpMul: hpMul * 1.5, interval: 1.5 });
  return { monsters: groups };
};

// -------------------- Component --------------------

const TowerDefense = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state held in refs for the animation loop, mirrored to React for UI.
  const stateRef = useRef({
    babies: [] as Baby[],
    monsters: [] as Monster[],
    projectiles: [] as Projectile[],
    money: 200,
    lives: 20,
    wave: 0,
    spawning: false,
    spawnQueue: [] as Array<{ template: number; hpMul: number; at: number }>,
    spawnTimer: 0,
    gameOver: false,
    victory: false,
    time: 0,
    nextId: 1,
    mouseX: 0,
    mouseY: 0,
    selected: null as BabyKind | null,
  });

  const [money, setMoney] = useState(200);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(0);
  const [spawning, setSpawning] = useState(false);
  const [selected, setSelected] = useState<BabyKind | null>(null);
  const [status, setStatus] = useState<'playing' | 'gameover' | 'victory'>('playing');

  const sync = useCallback(() => {
    const s = stateRef.current;
    setMoney(s.money);
    setLives(s.lives);
    setWave(s.wave);
    setSpawning(s.spawning);
    if (s.gameOver) setStatus('gameover');
    else if (s.victory) setStatus('victory');
    else setStatus('playing');
  }, []);

  const startWave = useCallback(() => {
    const s = stateRef.current;
    if (s.spawning || s.gameOver || s.victory) return;
    s.wave += 1;
    const wave = buildWave(s.wave);
    const queue: typeof s.spawnQueue = [];
    let t = 0;
    wave.monsters.forEach((g) => {
      for (let i = 0; i < g.count; i++) {
        queue.push({ template: g.template, hpMul: g.hpMul, at: t });
        t += g.interval;
      }
      t += 0.5;
    });
    s.spawnQueue = queue;
    s.spawnTimer = 0;
    s.spawning = true;
    sync();
  }, [sync]);

  const reset = useCallback(() => {
    stateRef.current = {
      babies: [],
      monsters: [],
      projectiles: [],
      money: 200,
      lives: 20,
      wave: 0,
      spawning: false,
      spawnQueue: [],
      spawnTimer: 0,
      gameOver: false,
      victory: false,
      time: 0,
      nextId: 1,
      mouseX: 0,
      mouseY: 0,
      selected: null,
    };
    setSelected(null);
    sync();
  }, [sync]);

  // Keep ref in sync with react state for selected baby
  useEffect(() => {
    stateRef.current.selected = selected;
  }, [selected]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw(ctx);
      raf = requestAnimationFrame(loop);
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.gameOver || s.victory) return;
      s.time += dt;

      // Spawning
      if (s.spawning) {
        s.spawnTimer += dt;
        while (s.spawnQueue.length && s.spawnQueue[0].at <= s.spawnTimer) {
          const item = s.spawnQueue.shift()!;
          const tmpl = MONSTERS[item.template];
          const start = WAYPOINTS[0];
          s.monsters.push({
            id: s.nextId++,
            x: start.x,
            y: start.y,
            hp: tmpl.hp * item.hpMul,
            maxHp: tmpl.hp * item.hpMul,
            speed: tmpl.speed,
            bounty: Math.round(tmpl.bounty * item.hpMul),
            damage: 1,
            emoji: tmpl.emoji,
            segment: 1,
            color: tmpl.color,
          });
        }
        if (!s.spawnQueue.length && s.monsters.length === 0) {
          s.spawning = false;
          s.money += 25 + s.wave * 5; // wave bonus
          if (s.wave >= 15) s.victory = true;
          sync();
        }
      }

      // Move monsters along path
      for (const m of s.monsters) {
        if (m.segment >= WAYPOINTS.length) continue;
        const target = WAYPOINTS[m.segment];
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const dist = Math.hypot(dx, dy);
        const step = m.speed * dt;
        if (step >= dist) {
          m.x = target.x;
          m.y = target.y;
          m.segment += 1;
        } else {
          m.x += (dx / dist) * step;
          m.y += (dy / dist) * step;
        }
      }

      // Monsters that reached the end damage the crib
      const survivors: Monster[] = [];
      for (const m of s.monsters) {
        if (m.segment >= WAYPOINTS.length) {
          s.lives -= 1;
          if (s.lives <= 0) {
            s.lives = 0;
            s.gameOver = true;
          }
          sync();
        } else {
          survivors.push(m);
        }
      }
      s.monsters = survivors;

      // Babies shoot
      for (const b of s.babies) {
        const type = BABY_TYPES[b.type];
        b.cooldown -= dt;
        if (b.cooldown > 0) continue;
        // Pick furthest-along monster in range
        let target: Monster | null = null;
        let bestSeg = -Infinity;
        for (const m of s.monsters) {
          const d = Math.hypot(m.x - b.x, m.y - b.y);
          if (d <= type.range) {
            if (m.segment > bestSeg) {
              bestSeg = m.segment;
              target = m;
            }
          }
        }
        if (target) {
          s.projectiles.push({
            id: s.nextId++,
            x: b.x,
            y: b.y,
            targetId: target.id,
            damage: type.damage,
            speed: 420,
            emoji: type.projectile,
          });
          b.cooldown = 1 / type.fireRate;
        }
      }

      // Update projectiles
      const liveProj: Projectile[] = [];
      for (const p of s.projectiles) {
        const target = s.monsters.find((m) => m.id === p.targetId);
        if (!target) continue;
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);
        const step = p.speed * dt;
        if (step >= dist) {
          target.hp -= p.damage;
        } else {
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
          liveProj.push(p);
        }
      }
      s.projectiles = liveProj;

      // Remove dead monsters
      const alive: Monster[] = [];
      for (const m of s.monsters) {
        if (m.hp <= 0) {
          s.money += m.bounty;
          sync();
        } else alive.push(m);
      }
      s.monsters = alive;
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      // Background: grass grid
      ctx.fillStyle = '#86efac';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = 'rgba(22, 101, 52, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE, 0);
        ctx.lineTo(x * TILE, HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE);
        ctx.lineTo(WIDTH, y * TILE);
        ctx.stroke();
      }

      // Draw path
      ctx.strokeStyle = '#b4836a';
      ctx.lineWidth = TILE * 0.85;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      WAYPOINTS.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Dashed center of path
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      WAYPOINTS.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Crib (goal) marker
      const last = WAYPOINTS[WAYPOINTS.length - 1];
      ctx.font = `${TILE}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛏️', last.x, last.y);

      // Placement preview
      if (s.selected) {
        const cx = Math.floor(s.mouseX / TILE);
        const cy = Math.floor(s.mouseY / TILE);
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
          const valid = canPlace(cx, cy, s.babies);
          const type = BABY_TYPES[s.selected];
          const center = cellCenter(cx, cy);
          ctx.fillStyle = valid ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';
          ctx.fillRect(cx * TILE, cy * TILE, TILE, TILE);
          // Range preview
          ctx.beginPath();
          ctx.arc(center.x, center.y, type.range, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = `${TILE * 0.7}px serif`;
          ctx.globalAlpha = 0.8;
          ctx.fillText(type.emoji, center.x, center.y);
          ctx.globalAlpha = 1;
        }
      }

      // Babies
      for (const b of s.babies) {
        const type = BABY_TYPES[b.type];
        ctx.beginPath();
        ctx.arc(b.x, b.y, TILE * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = type.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = `${TILE * 0.7}px serif`;
        ctx.fillStyle = '#000';
        ctx.fillText(type.emoji, b.x, b.y + 2);
      }

      // Monsters
      for (const m of s.monsters) {
        ctx.font = `${TILE * 0.75}px serif`;
        ctx.fillText(m.emoji, m.x, m.y + 2);
        // hp bar
        const w = TILE * 0.7;
        const h = 5;
        const frac = Math.max(0, m.hp / m.maxHp);
        ctx.fillStyle = '#111';
        ctx.fillRect(m.x - w / 2, m.y - TILE * 0.55, w, h);
        ctx.fillStyle = frac > 0.5 ? '#22c55e' : frac > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(m.x - w / 2, m.y - TILE * 0.55, w * frac, h);
      }

      // Projectiles
      ctx.font = `${TILE * 0.5}px serif`;
      for (const p of s.projectiles) {
        ctx.fillText(p.emoji, p.x, p.y);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sync]);

  // Mouse / click handlers
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
    stateRef.current.mouseY = (e.clientY - rect.top) * scaleY;
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.selected || s.gameOver || s.victory) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cx = Math.floor(mx / TILE);
    const cy = Math.floor(my / TILE);
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;
    if (!canPlace(cx, cy, s.babies)) return;
    const type = BABY_TYPES[s.selected];
    if (s.money < type.cost) return;
    s.money -= type.cost;
    const c = cellCenter(cx, cy);
    s.babies.push({
      id: s.nextId++,
      type: s.selected,
      cx,
      cy,
      x: c.x,
      y: c.y,
      cooldown: 0,
    });
    sync();
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 text-slate-900"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-3xl md:text-4xl font-black drop-shadow-sm">
            👶 תינוקות נגד מפלצות 👹
          </h1>
          <div className="flex items-center gap-3 text-lg font-bold">
            <span className="bg-yellow-300 px-3 py-1 rounded-xl shadow">💰 {money}</span>
            <span className="bg-red-300 px-3 py-1 rounded-xl shadow">❤️ {lives}</span>
            <span className="bg-purple-300 px-3 py-1 rounded-xl shadow">🌊 גל {wave}/15</span>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex flex-col items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                onMouseMove={onMove}
                onClick={onClick}
                className="block cursor-crosshair max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
              {status !== 'playing' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <div className="text-5xl font-black mb-4">
                    {status === 'victory' ? '🎉 ניצחון! 🎉' : '💀 המפלצות ניצחו 💀'}
                  </div>
                  <button
                    onClick={reset}
                    className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl text-xl hover:bg-yellow-300 transition"
                  >
                    משחק חדש
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={startWave}
                disabled={spawning || status !== 'playing'}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg text-lg"
              >
                {spawning ? 'הגל בעיצומו…' : `▶️ התחל גל ${wave + 1}`}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg text-lg"
              >
                🔄 אתחול
              </button>
            </div>
          </div>

          <aside className="w-full lg:w-72 bg-white/80 backdrop-blur rounded-2xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-3">בחר מגן</h2>
            <div className="space-y-3">
              {(Object.values(BABY_TYPES) as BabyType[]).map((t) => {
                const isSelected = selected === t.key;
                const affordable = money >= t.cost;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelected(isSelected ? null : t.key)}
                    className={`w-full text-right p-3 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-green-500 bg-green-100'
                        : 'border-transparent bg-slate-100 hover:bg-slate-200'
                    } ${!affordable ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-3xl"
                        style={{ background: t.color }}
                      >
                        {t.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{t.name}</div>
                        <div className="text-sm text-slate-700">
                          💰 {t.cost} · ⚔️ {t.damage} · 🎯 {t.range}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-slate-700 leading-relaxed">
              <p className="font-bold mb-1">איך משחקים?</p>
              <ul className="list-disc pr-5 space-y-1">
                <li>בחר תינוק מגן והנח אותו ליד השביל.</li>
                <li>התינוקות יורים על המפלצות שעוברות.</li>
                <li>אל תיתן למפלצות להגיע לעריסה 🛏️</li>
                <li>15 גלים של מפלצות — שרוד את כולם!</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// helper
const canPlace = (cx: number, cy: number, babies: Baby[]) => {
  if (pathTiles.has(`${cx},${cy}`)) return false;
  return !babies.some((b) => b.cx === cx && b.cy === cy);
};

export default TowerDefense;
