/* Settings scene - gravity slider, sound toggle, back button.
   Controls are native DOM (see js/domui.js) for reliable mobile touch.
   Phaser only renders the static text here. */
class Settings extends Phaser.Scene {
  constructor() { super('Settings'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.scale.width, H = this.scale.height;

    this.add.text(W / 2, 90, 'SETTINGS', {
      fontFamily: 'Courier New, monospace', fontSize: '34px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 200, 'GRAVITY', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.gravityValText = this.add.text(W / 2, 232, '', {
      fontFamily: 'Courier New, monospace', fontSize: '26px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 340, '1.0x = lunar   higher = harder', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#666666'
    }).setOrigin(0.5);

    // ---- DOM controls (reliable on mobile) ----
    DOMUI.init();
    DOMUI.clear();

    let g = this.registry.get('gravity');
    if (typeof g !== 'number' || isNaN(g)) g = 1.0;
    const applyGravity = (v) => {
      this.registry.set('gravity', v);
      localStorage.setItem('ll_gravity', String(v));
      this.gravityValText.setText('\u00d7' + v.toFixed(1));
    };
    applyGravity(g);
    DOMUI.range(W / 2, 296, 280, 0.5, 2.5, 0.1, g, applyGravity);

    // Sound toggle
    const refreshSound = () => {
      const muted = this.registry.get('mute') === true;
      this.soundBtn.el.textContent = 'SOUND: ' + (muted ? 'OFF' : 'ON');
    };
    this.soundBtn = DOMUI.tapButton(W / 2, 410, 220, 50, '', 18, () => {
      const nm = !(this.registry.get('mute') === true);
      this.registry.set('mute', nm);
      localStorage.setItem('ll_mute', nm ? '1' : '0');
      Audio.setMuted(nm);
      if (!nm) Audio.click();
      refreshSound();
    });
    refreshSound();

    // Back button
    DOMUI.tapButton(W / 2, H - 70, 180, 50, 'BACK', 20, () => {
      Audio.click();
      this.scene.start('Menu');
    });

    this.events.on('shutdown', () => DOMUI.clear());
  }
}
