/* Settings scene - gravity + fuel sliders, sound toggle, back button.
   Controls are native DOM (see js/domui.js) for reliable mobile touch.
   Phaser only renders the static text here. */
class Settings extends Phaser.Scene {
  constructor() { super('Settings'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.scale.width, H = this.scale.height;

    this.add.text(W / 2, 72, 'SETTINGS', {
      fontFamily: 'Courier New, monospace', fontSize: '34px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    // ===== GRAVITY =====
    this.add.text(W / 2, 146, 'GRAVITY', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.gravityValText = this.add.text(W / 2, 176, '', {
      fontFamily: 'Courier New, monospace', fontSize: '26px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 268, '1.0x = lunar   higher = harder', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#666666'
    }).setOrigin(0.5);

    // ===== FUEL =====
    this.add.text(W / 2, 308, 'FUEL', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.fuelValText = this.add.text(W / 2, 338, '', {
      fontFamily: 'Courier New, monospace', fontSize: '26px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 430, '1.0x = default   more = easier', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#666666'
    }).setOrigin(0.5);

    // ---- DOM controls (reliable on mobile) ----
    DOMUI.init();
    DOMUI.clear();

    // Gravity slider
    let g = this.registry.get('gravity');
    if (typeof g !== 'number' || isNaN(g)) g = 1.0;
    const applyGravity = (v) => {
      this.registry.set('gravity', v);
      localStorage.setItem('ll_gravity', String(v));
      this.gravityValText.setText('\u00d7' + v.toFixed(1));
    };
    applyGravity(g);
    DOMUI.range(W / 2, 232, 280, 0.5, 2.5, 0.1, g, applyGravity);

    // Fuel slider (identical styling)
    let f = this.registry.get('fuel');
    if (typeof f !== 'number' || isNaN(f)) f = 1.0;
    const applyFuel = (v) => {
      this.registry.set('fuel', v);
      localStorage.setItem('ll_fuel', String(v));
      this.fuelValText.setText('\u00d7' + v.toFixed(1));
    };
    applyFuel(f);
    DOMUI.range(W / 2, 394, 280, 0.5, 2.5, 0.1, f, applyFuel);

    // Sound toggle
    const refreshSound = () => {
      const muted = this.registry.get('mute') === true;
      this.soundBtn.el.textContent = 'SOUND: ' + (muted ? 'OFF' : 'ON');
    };
    this.soundBtn = DOMUI.tapButton(W / 2, 482, 220, 50, '', 18, () => {
      const nm = !(this.registry.get('mute') === true);
      this.registry.set('mute', nm);
      localStorage.setItem('ll_mute', nm ? '1' : '0');
      Audio.setMuted(nm);
      if (!nm) Audio.click();
      refreshSound();
    });
    refreshSound();

    // Back button
    DOMUI.tapButton(W / 2, H - 50, 180, 50, 'BACK', 20, () => {
      Audio.click();
      this.scene.start('Menu');
    });

    this.events.on('shutdown', () => DOMUI.clear());
  }
}
