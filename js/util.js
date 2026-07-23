/* ============================================================
   Lunar Lander - shared helpers, constants and drawing utils
   ============================================================ */

// --- Tunable game constants (in game units / pixels & seconds) ---
const GRAVITY_BASE = 28;   // px/s^2 at gravity multiplier 1.0
const THRUST       = 82;   // px/s^2 of thrust (always > max gravity)
const FUEL_MAX     = 1000; // fuel units at start of each level
const FUEL_BURN    = 22;   // fuel units burned per second of thrust
const ROT_SPEED    = 3.0;  // radians per second while rotating

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

// Create a labelled, hover/press styled button (interactive container).
function makeButton(scene, x, y, w, h, label, opts) {
  opts = opts || {};
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  const draw = (over) => {
    g.clear();
    if (over) {
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    }
    g.lineStyle(2, 0xffffff, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
  };

  const t = scene.add.text(0, 0, label, {
    fontFamily: 'Courier New, monospace',
    fontSize: opts.size || '20px',
    color: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  c.add([g, t]);
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

  const refresh = (over) => { draw(over); t.setColor(over ? '#000000' : '#ffffff'); };
  refresh(false);

  c.on('pointerover', () => refresh(true));
  c.on('pointerout',  () => refresh(false));
  c.on('pointerdown', () => c.setScale(0.95));
  c.on('pointerup',   () => c.setScale(1));
  c.on('pointerupoutside', () => { c.setScale(1); refresh(false); });

  c.label = t;
  return c;
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
