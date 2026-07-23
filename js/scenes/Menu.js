/* Menu / title scene */
class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;

    this.makeStars();

    // Title
    this.add.text(W / 2, 120, 'LUNAR', {
      fontFamily: 'Courier New, monospace', fontSize: '52px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(W / 2, 172, 'LANDER', {
      fontFamily: 'Courier New, monospace', fontSize: '52px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    // Animated lander
    this.landerG = this.add.graphics();

    // Hi-score
    this.hiText = this.add.text(W / 2, 250, 'HI-SCORE\n' + pad(this.registry.get('hiscore') || 0), {
      fontFamily: 'Courier New, monospace', fontSize: '20px', color: '#888888', align: 'center'
    }).setOrigin(0.5);

    // New game button
    const start = makeButton(this, W / 2, 360, 200, 58, 'NEW GAME', { size: '22px' });
    start.on('pointerup', () => {
      Audio.init(); Audio.resume(); Audio.click();
      this.scene.start('Game', { level: 1, lives: 3, score: 0 });
    });

    // Hint
    this.add.text(W / 2, 410, 'land gently, upright, on a pad', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#666666'
    }).setOrigin(0.5);

    // Settings gear (top-right)
    this.makeGear(W - 34, 34);

    this.timeSince = 0;
  }

  makeStars() {
    const g = this.add.graphics();
    const rng = mulberry32(1234);
    for (let i = 0; i < 70; i++) {
      const x = rng() * this.W;
      const y = rng() * this.H;
      const a = 0.2 + rng() * 0.6;
      g.fillStyle(0xffffff, a);
      g.fillRect(x, y, 1, 1);
    }
  }

  makeGear(x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(0, 0, 11);
    g.fillStyle(0xffffff, 0); // hit area
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x1 = Math.cos(a) * 10, y1 = Math.sin(a) * 10;
      const x2 = Math.cos(a) * 15, y2 = Math.sin(a) * 15;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
    }
    c.add(g);
    c.setSize(34, 34);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
    c.on('pointerover', () => c.setScale(1.1));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerdown', () => c.setScale(0.92));
    c.on('pointerup', () => {
      c.setScale(1);
      Audio.init(); Audio.resume(); Audio.click();
      this.scene.start('Settings');
    });
  }

  update(time, delta) {
    this.timeSince += delta;
    const a = Math.sin(time / 700) * 0.14;
    const thrust = (Math.floor(time / 900) % 4) === 0; // occasional puff
    const flame = thrust ? 8 + (Math.random() * 8) : 0;
    drawLander(this.landerG, this.W / 2, 300 + Math.sin(time / 700) * 4, a, thrust, 1.6, flame);
  }

  shutdown() { Audio.setThrust(false); }
}
