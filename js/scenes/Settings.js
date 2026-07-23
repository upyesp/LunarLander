/* Settings scene - gravity slider, sound toggle, back button */
class Settings extends Phaser.Scene {
  constructor() { super('Settings'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.scale.width, H = this.scale.height;

    this.add.text(W / 2, 90, 'SETTINGS', {
      fontFamily: 'Courier New, monospace', fontSize: '34px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    // ---- Gravity slider ----
    this.add.text(W / 2, 200, 'GRAVITY', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.gravityValText = this.add.text(W / 2, 230, '', {
      fontFamily: 'Courier New, monospace', fontSize: '26px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    const min = 0.5, max = 2.5;
    let g = this.registry.get('gravity');
    if (typeof g !== 'number' || isNaN(g)) g = 1.0;
    this.makeSlider(40, 290, W - 80, min, max, g);

    this.add.text(W / 2, 330, '1.0x = lunar   higher = harder', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#666666'
    }).setOrigin(0.5);

    // ---- Sound toggle ----
    this.refreshSoundButton();

    // ---- Back button ----
    const back = makeButton(this, W / 2, H - 70, 180, 50, 'BACK', { size: '20px' });
    back.on('pointerup', () => {
      Audio.click();
      this.scene.start('Menu');
    });
  }

  refreshSoundButton() {
    if (this.soundBtn) this.soundBtn.destroy();
    const W = this.scale.width;
    const muted = this.registry.get('mute') === true;
    this.soundBtn = makeButton(this, W / 2, 410, 220, 50,
      'SOUND: ' + (muted ? 'OFF' : 'ON'), { size: '18px' });
    this.soundBtn.on('pointerup', () => {
      const nm = !(this.registry.get('mute') === true);
      this.registry.set('mute', nm);
      localStorage.setItem('ll_mute', nm ? '1' : '0');
      Audio.setMuted(nm);
      if (!nm) Audio.click();
      this.refreshSoundButton();
    });
  }

  makeSlider(x, y, w, min, max, val) {
    const track = this.add.graphics();
    const knob  = this.add.graphics();

    const draw = (t) => {
      track.clear();
      track.fillStyle(0x222222, 1); track.fillRoundedRect(x, y - 4, w, 8, 4);
      track.lineStyle(2, 0xffffff, 1); track.strokeRoundedRect(x, y - 4, w, 8, 4);
      const kx = x + t * w;
      knob.clear();
      knob.fillStyle(0x000000, 1); knob.fillCircle(kx, y, 13);
      knob.lineStyle(2, 0xffffff, 1); knob.strokeCircle(kx, y, 13);
    };

    const apply = (v) => {
      this.registry.set('gravity', v);
      localStorage.setItem('ll_gravity', String(v));
      this.gravityValText.setText('\u00d7' + v.toFixed(1));
    };

    const setFromPointer = (px) => {
      let t = (px - x) / w;
      t = Phaser.Math.Clamp(t, 0, 1);
      // snap to 0.1
      const v = Math.round((min + t * (max - min)) * 10) / 10;
      draw((v - min) / (max - min));
      apply(v);
    };

    draw((val - min) / (max - min));
    apply(val);

    const zone = this.add.zone(x + w / 2, y, w + 40, 50).setInteractive();
    zone.on('pointerdown', (p) => setFromPointer(p.x));
    zone.on('pointermove', (p) => { if (p.isDown) setFromPointer(p.x); });
  }
}
