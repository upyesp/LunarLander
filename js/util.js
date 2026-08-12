/* ============================================================
   Lunar Lander - shared helpers, constants and drawing utils
   ============================================================ */

// --- Canvas / virtual resolution (single source of truth) ---
const GAME_W = 360;
const GAME_H = 640;

// --- Tunable game constants (in game units / pixels & seconds) ---
const GRAVITY_BASE = 28;   // px/s^2 at gravity multiplier 1.0
const THRUST       = 82;   // px/s^2 of thrust (always > max gravity)
const FUEL_MAX     = 1000; // fuel units at start of each level
const FUEL_BURN    = 22;   // fuel units burned per second of thrust
const FUEL_LEVEL_DECAY = 0.8; // each level beyond the first has 20% less fuel
const ROT_SPEED    = 3.0;  // radians per second while rotating

// --- Difficulty presets (multipliers relative to the 1.0 defaults above) ---
// Each difficulty fixes both the gravity and fuel multipliers. Easy uses the
// game's unmodified defaults; harder levels apply stronger gravity and less
// fuel. The chosen preset is the single source of truth for the gravity +
// fuel values the Game scene reads from the registry (see Boot / Settings).
const DIFFICULTIES = {
  easy:   { gravity: 1.0, fuel: 1.0 }, // the game's defaults
  medium: { gravity: 1.2, fuel: 0.7 }, // +20% gravity, -30% fuel
  hard:   { gravity: 1.4, fuel: 0.3 }  // +40% gravity, -70% fuel
};
const DEFAULT_DIFFICULTY = 'medium'; // used on a fresh launch (no saved setting)

// Landing success thresholds
const VY_OK  = 42;  // max vertical speed   (px/s)
const VX_OK  = 26;  // max horizontal speed (px/s)
const ANG_OK = 0.22;// max tilt off vertical (radians ~ 12.6 deg)

// Rotate a local point (lx,ly) by angle a, scale s, offset by (x,y)
function rotPt(lx, ly, a, x, y, s) {
  const c = Math.cos(a), si = Math.sin(a);
  return { x: x + (lx * c - ly * si) * s, y: y + (lx * si + ly * c) * s };
}

// Draw the lander (white vector lines) into a Phaser Graphics object.
// a = rotation (0 = upright, nose up). thrust shows the flame.
function drawLander(g, x, y, a, thrust, scale, flameLen) {
  scale = scale || 1;
  g.clear();
  g.lineStyle(2 * scale, 0xffffff, 1);

  // capsule body (pentagon, pointed nose up)
  const body = [[0, -16], [5, -10], [7, 2], [-7, 2], [-5, -10]];
  const rb = body.map(p => rotPt(p[0], p[1], a, x, y, scale));
  g.beginPath();
  g.moveTo(rb[0].x, rb[0].y);
  for (let i = 1; i < rb.length; i++) g.lineTo(rb[i].x, rb[i].y);
  g.closePath();
  g.strokePath();

  // landing legs
  const legs = [[[-7, 2], [-16, 12]], [[7, 2], [16, 12]]];
  legs.forEach(L => {
    const p1 = rotPt(L[0][0], L[0][1], a, x, y, scale);
    const p2 = rotPt(L[1][0], L[1][1], a, x, y, scale);
    g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.strokePath();
  });

  // footpads
  const pads = [[[-20, 12], [-12, 12]], [[12, 12], [20, 12]]];
  pads.forEach(P => {
    const p1 = rotPt(P[0][0], P[0][1], a, x, y, scale);
    const p2 = rotPt(P[1][0], P[1][1], a, x, y, scale);
    g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.strokePath();
  });

  // nozzle
  const n1 = rotPt(-3, 2, a, x, y, scale);
  const n2 = rotPt(3, 2, a, x, y, scale);
  g.beginPath(); g.moveTo(n1.x, n1.y); g.lineTo(n2.x, n2.y); g.strokePath();

  // thrust flame
  if (thrust) {
    const tip = rotPt(0, 4 + (flameLen || 12), a, x, y, scale);
    const bl  = rotPt(-3, 4, a, x, y, scale);
    const br  = rotPt(3, 4, a, x, y, scale);
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(bl.x, bl.y);
    g.lineTo(br.x, br.y);
    g.lineTo(tip.x, tip.y);
    g.closePath();
    g.fillPath();
  }
}

// Zero pad a number for score display
function pad(n, l) {
  l = l || 5;
  return ('00000' + n).slice(-l);
}

// Normalise an angle to [-PI, PI]
function normAngle(a) {
  while (a > Math.PI)  a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Seeded PRNG (mulberry32) for deterministic terrain per level
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
