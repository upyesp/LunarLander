/* ============================================================
   Game scene - terrain, lander physics, controls, HUD, win/lose
   ============================================================ */

// Per-level configuration: terrain roughness + landing pads (center x, width, multiplier)
const LEVELS = [
  { rough: 10, pads: [{ cx: 180, w: 66, m: 1 }] },
  { rough: 16, pads: [{ cx: 120, w: 48, m: 2 }] },
  { rough: 20, pads: [{ cx: 90,  w: 54, m: 1 }, { cx: 260, w: 34, m: 3 }] },
  { rough: 26, pads: [{ cx: 70,  w: 42, m: 2 }, { cx: 250, w: 30, m: 4 }] },
  { rough: 32, pads: [{ cx: 80,  w: 38, m: 3 }, { cx: 255, w: 26, m: 5 }] }
];

const TOP_MIN = 250;   // highest a terrain peak may reach
const BOT_MAX = 470;   // lowest the terrain valley may go

class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  create(data) {
    this.W = this.scale.width;
    this.H = this.scale.height;

    this.level = data.level || 1;
    this.lives = (typeof data.lives === 'number') ? data.lives : 3;
    this.score = data.score || 0;
    this.gravityMult = this.registry.get('gravity') || 1;
    this.fuelMult = this.registry.get('fuel') || 1;
    this.fuelMax = FUEL_MAX * this.fuelMult; // capacity scales with the setting
    this.state = 'playing'; // playing | landed | crashed | done

    Audio.init(); Audio.resume();

    this.makeStars();
    this.terrainG = this.add.graphics();
    this.padTexts = [];
    this.buildTerrain();

    this.landerG = this.add.graphics();
    this.resetLander();

    this.makeHUD();
    this.makeControls();

    // keyboard support (handy for desktop testing)
    this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;

    // clear any held thrust + DOM controls on scene shutdown
    this.events.on('shutdown', () => { Audio.setThrust(false); DOMUI.clear(); });
    this.events.on('pause',     () => { Audio.setThrust(false); });

    this.showBanner('LEVEL ' + this.level, 1100);
  }

  // ---------- background ----------
  makeStars() {
    const g = this.add.graphics();
    const rng = mulberry32(this.level * 7919 + 5);
    for (let i = 0; i < 80; i++) {
      const x = rng() * this.W;
      const y = rng() * (this.H - 110);
      const a = 0.15 + rng() * 0.55;
      g.fillStyle(0xffffff, a);
      g.fillRect(x, y, 1, 1);
    }
    this.starG = g;
  }

  // ---------- terrain ----------
  buildTerrain() {
    const cfg = LEVELS[Phaser.Math.Clamp(this.level - 1, 0, LEVELS.length - 1)];
    const rng = mulberry32((this.level * 2654435761) >>> 0);
    const step = 10;
    const pts = [];
    let y = 360;
    const rough = cfg.rough;

    for (let x = 0; x <= this.W; x += step) {
      y += (rng() - 0.5) * rough * 2;
      y = Phaser.Math.Clamp(y, TOP_MIN, BOT_MAX);
      pts.push({ x: x, y: y });
    }

    // carve flat pads
    const pads = [];
    cfg.pads.forEach(pc => {
      const x1 = pc.cx - pc.w / 2;
      const x2 = pc.cx + pc.w / 2;
      let sum = 0, cnt = 0;
      pts.forEach(p => { if (p.x >= x1 - 2 && p.x <= x2 + 2) { sum += p.y; cnt++; } });
      const py = cnt ? sum / cnt : 400;
      pts.forEach(p => { if (p.x >= x1 && p.x <= x2) p.y = py; });
      pads.push({ x1: x1, x2: x2, y: py, m: pc.m });
    });

    this.terrainPoints = pts;
    this.pads = pads;
    this.drawTerrainFull();
  }

  drawTerrainFull() {
    // remove old pad labels
    this.padTexts.forEach(t => t.destroy());
    this.padTexts = [];

    const g = this.terrainG;
    const pts = this.terrainPoints;
    g.clear();

    // ground fill
    g.beginPath();
    g.moveTo(pts[0].x, this.H);
    pts.forEach(p => g.lineTo(p.x, p.y));
    g.lineTo(pts[pts.length - 1].x, this.H);
    g.closePath();
    g.fillStyle(0x1a1a1a, 1);
    g.fillPath();

    // surface line
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();

    // pad highlights + multiplier labels
    this.pads.forEach(pad => {
      g.lineStyle(3, 0xffffff, 1);
      g.beginPath();
      g.moveTo(pad.x1, pad.y);
      g.lineTo(pad.x2, pad.y);
      g.strokePath();
      // tick marks at pad ends
      g.beginPath();
      g.moveTo(pad.x1, pad.y); g.lineTo(pad.x1, pad.y - 5);
      g.moveTo(pad.x2, pad.y); g.lineTo(pad.x2, pad.y - 5);
      g.strokePath();

      const t = this.add.text((pad.x1 + pad.x2) / 2, pad.y - 16, '\u00d7' + pad.m, {
        fontFamily: 'Courier New, monospace', fontSize: '13px', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5);
      this.padTexts.push(t);
    });
  }

  terrainY(x) {
    const pts = this.terrainPoints;
    while (x < 0) x += this.W;
    while (x > this.W) x -= this.W;
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + t * (pts[i + 1].y - pts[i].y);
      }
    }
    return pts[pts.length - 1].y;
  }

  // ---------- lander ----------
  resetLander() {
    this.fuelCap = this.fuelForLevel(this.level);
    this.lander = {
      x: this.W / 2,
      y: 70,
      vx: (Math.random() - 0.5) * 12,
      vy: 0,
      a: 0,
      fuel: this.fuelCap
    };
    this.thrustingNow = false;
  }

  // Fuel available on a given level: the difficulty-adjusted base capacity,
  // reduced by FUEL_LEVEL_DECAY for each level beyond the first, so later
  // levels are progressively harder. This is the capacity for the current
  // level/attempt and also scales the HUD fuel bar.
  fuelForLevel(n) {
    return this.fuelMax * Math.pow(FUEL_LEVEL_DECAY, n - 1);
  }

  // ---------- HUD ----------
  makeHUD() {
    this.scoreText = this.add.text(10, 8, 'SCORE 00000', {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#ffffff'
    });
    this.levelText = this.add.text(this.W / 2, 8, 'LEVEL 1', {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5, 0);
    this.hiText = this.add.text(this.W - 10, 8, 'HI 00000', {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#888888'
    }).setOrigin(1, 0);

    this.fuelLabel = this.add.text(10, 26, 'FUEL', {
      fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#888888'
    });
    this.fuelG = this.add.graphics();

    this.livesText = this.add.text(10, 44, 'LIVES x3', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#888888'
    });

    this.updateHUD();
  }

  updateHUD() {
    this.scoreText.setText('SCORE ' + pad(this.score));
    this.levelText.setText('LEVEL ' + this.level);
    this.hiText.setText('HI ' + pad(this.registry.get('hiscore') || 0));
    this.livesText.setText('LIVES x' + Math.max(0, this.lives));

    // Only redraw the fuel bar when it has visibly changed; avoids a
    // per-frame Graphics re-upload (helps keep input responsive on mobile).
    const ratio = Phaser.Math.Clamp(this.lander.fuel / this.fuelCap, 0, 1);
    const low = ratio < 0.25;
    const step = Math.round(ratio * 50); // ~2% granularity
    if (this._lastFuelStep !== step || this._lastFuelLow !== low) {
      this._lastFuelStep = step;
      this._lastFuelLow = low;
      const g = this.fuelG;
      const fx = 48, fy = 30, fw = this.W - 58, fh = 8;
      g.clear();
      g.lineStyle(1, 0xffffff, 1);
      g.strokeRect(fx, fy, fw, fh);
      g.fillStyle(low ? 0x666666 : 0xffffff, 1);
      g.fillRect(fx + 1, fy + 1, (fw - 2) * ratio, fh - 2);
    }
  }

  // ---------- on-screen controls (native DOM, see js/domui.js) ----------
  // Why DOM, not Phaser: Phaser's canvas hit-testing was unreliable on mobile
  // (missed presses + cross-firing between buttons). Native DOM touch elements
  // are coordinate-accurate on every mobile browser and handle multi-touch
  // natively (rotate + thrust simultaneously).
  makeControls() {
    DOMUI.init();
    DOMUI.clear();
    const cy = this.H - 60;
    this.btnRotL   = DOMUI.holdButton(58,         cy, 96, 96, '\u25c0', '38px');      // ◀
    this.btnRotR   = DOMUI.holdButton(this.W - 58, cy, 96, 96, '\u25b6', '38px');      // ▶
    this.btnThrust = DOMUI.holdButton(this.W / 2,  cy, 156, 96, 'THRUST', '22px');
  }

  releaseAllControls() {
    if (this.btnRotL)   this.btnRotL.release();
    if (this.btnRotR)   this.btnRotR.release();
    if (this.btnThrust) this.btnThrust.release();
  }

  // ---------- main loop ----------
  update(time, delta) {
    if (this.state !== 'playing') return;

    const dt = Math.min(delta, 50) / 1000;
    const L = this.lander;

    // rotation input (DOM buttons are coordinate-accurate; keyboard for desktop)
    let rot = 0;
    if (this.btnRotL.pressed || (this.cursors && this.cursors.left.isDown))  rot -= 1;
    if (this.btnRotR.pressed || (this.cursors && this.cursors.right.isDown)) rot += 1;
    L.a += rot * ROT_SPEED * dt;

    // thrust input
    const wantThrust = this.btnThrust.pressed ||
                       (this.cursors && (this.cursors.up.isDown || (this.cursors.space && this.cursors.space.isDown)));
    const thrusting = wantThrust && L.fuel > 0;

    // gravity
    L.vy += GRAVITY_BASE * this.gravityMult * dt;

    if (thrusting) {
      L.vx += Math.sin(L.a) * THRUST * dt;
      L.vy += -Math.cos(L.a) * THRUST * dt;
      L.fuel = Math.max(0, L.fuel - FUEL_BURN * dt);
      Audio.setThrust(true);
      this.thrustingNow = true;
    } else {
      Audio.setThrust(false);
      this.thrustingNow = false;
    }

    L.x += L.vx * dt;
    L.y += L.vy * dt;

    // horizontal wrap (classic behaviour)
    if (L.x < 0) L.x += this.W;
    if (L.x > this.W) L.x -= this.W;

    this.checkCollision();

    // draw ship + flame flicker
    const flame = thrusting ? 9 + Math.random() * 10 : 0;
    drawLander(this.landerG, L.x, L.y, L.a, thrusting, 1, flame);

    this.updateHUD();
  }

  // ---------- collision / outcome ----------
  checkCollision() {
    const L = this.lander;
    const feet = [
      rotPt(-16, 12, L.a, L.x, L.y, 1),
      rotPt(16, 12, L.a, L.x, L.y, 1)
    ];

    for (let i = 0; i < feet.length; i++) {
      const f = feet[i];
      const ty = this.terrainY(f.x);
      if (f.y >= ty) {
        // contact! find pad by lander centre x
        let cx = L.x % this.W; if (cx < 0) cx += this.W;
        const pad = this.pads.find(p => cx >= p.x1 && cx <= p.x2);
        const an = normAngle(L.a);
        const safe = pad &&
                     Math.abs(L.vy) < VY_OK &&
                     Math.abs(L.vx) < VX_OK &&
                     Math.abs(an) < ANG_OK;
        if (safe) this.onLand(pad); else this.onCrash();
        return;
      }
    }
  }

  onLand(pad) {
    this.state = 'landed';
    Audio.setThrust(false);
    Audio.success();
    this.thrustingNow = false;

    // snap upright onto the pad
    this.lander.a = 0;
    this.lander.vx = 0; this.lander.vy = 0;
    this.lander.y = pad.y - 12;
    drawLander(this.landerG, this.lander.x, this.lander.y, 0, false, 1, 0);

    const gain = pad.m * 150 + Math.floor(this.lander.fuel * 0.2);
    this.score += gain;

    if (this.score > (this.registry.get('hiscore') || 0)) {
      this.registry.set('hiscore', this.score);
      localStorage.setItem('ll_hiscore', String(this.score));
    }
    this.updateHUD();

    const last = this.level >= LEVELS.length;
    this.showBanner('LANDED!  +' + gain, 1500);
    this.time.delayedCall(1700, () => {
      if (last) this.finish(true);
      else this.startLevel(this.level + 1);
    });
  }

  onCrash() {
    this.state = 'crashed';
    Audio.setThrust(false);
    Audio.crash();
    this.thrustingNow = false;

    // explosion
    const eg = this.add.graphics();
    eg.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 22;
      eg.beginPath();
      eg.moveTo(this.lander.x, this.lander.y);
      eg.lineTo(this.lander.x + Math.cos(ang) * r, this.lander.y + Math.sin(ang) * r);
      eg.strokePath();
    }
    this.tweens.add({ targets: eg, alpha: 0, duration: 900, onComplete: () => eg.destroy() });
    this.landerG.clear();

    this.lives--;
    this.updateHUD();
    this.showBanner('CRASHED', 1200);
    this.time.delayedCall(1500, () => {
      if (this.lives <= 0) this.finish(false);
      else this.restartLevel();
    });
  }

  startLevel(n) {
    this.level = n;
    this.buildTerrain();
    this.resetLander();
    this.state = 'playing';
    this.showBanner('LEVEL ' + n, 1000);
    this.updateHUD();
  }

  restartLevel() {
    this.resetLander();
    this.state = 'playing';
    this.updateHUD();
  }

  finish(win) {
    this.state = 'done';
    Audio.setThrust(false);
    this.scene.start('GameOver', { score: this.score, win: !!win });
  }

  // ---------- banner ----------
  showBanner(text, dur) {
    if (this.bannerText) this.bannerText.destroy();
    const t = this.add.text(this.W / 2, this.H * 0.42, text, {
      fontFamily: 'Courier New, monospace', fontSize: '30px', fontStyle: 'bold', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
    t.setAlpha(0);
    this.bannerText = t;
    this.tweens.add({ targets: t, alpha: 1, duration: 200 });
    this.time.delayedCall(dur, () => {
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => { t.destroy(); if (this.bannerText === t) this.bannerText = null; } });
    });
  }
}
