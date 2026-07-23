/* Menu / title scene */
class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    DOMUI.clear(); // remove any leftover DOM controls from Game/Settings
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

    // New game button (DOM -> reliable on mobile)
    DOMUI.tapButton(W / 2, 360, 220, 60, 'NEW GAME', 22, () => {
      Audio.init(); Audio.resume(); Audio.click();
      this.scene.start('Game', { level: 1, lives: 3, score: 0 });
    });

    // Hint
    this.add.text(W / 2, 410, 'land gently, upright, on a pad', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#666666'
    }).setOrigin(0.5);

    // Settings gear (DOM, top-right). Generous 56x56 touch target.
    const gearSVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="3.2"/>' +
      '<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3' +
      'M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M5.2 18.8l2.1-2.1M16.7 7.3l2.1-2.1"/>' +
      '</svg>';
    DOMUI.iconButton(W - 34, 34, 56, 56, gearSVG, () => {
      Audio.init(); Audio.resume(); Audio.click();
      this.scene.start('Settings');
    });

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

  update(time, delta) {
    this.timeSince += delta;
    const a = Math.sin(time / 700) * 0.14;
    const thrust = (Math.floor(time / 900) % 4) === 0; // occasional puff
    const flame = thrust ? 8 + (Math.random() * 8) : 0;
    drawLander(this.landerG, this.W / 2, 300 + Math.sin(time / 700) * 4, a, thrust, 1.6, flame);
  }

  shutdown() { Audio.setThrust(false); }
}
