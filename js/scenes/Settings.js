/* Settings scene - difficulty selector, sound toggle, back button.
   The DIFFICULTY choice is the single source of truth for the gravity + fuel
   multipliers the Game scene uses (see DIFFICULTIES in js/util.js); picking a
   preset writes both values into the registry and persists the choice (like
   the sound toggle). Controls are native DOM (js/domui.js) for reliable
   mobile touch; Phaser only renders the static text here. */
class Settings extends Phaser.Scene {
  constructor() { super('Settings'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.scale.width, H = this.scale.height;

    this.add.text(W / 2, 72, 'SETTINGS', {
      fontFamily: 'Courier New, monospace', fontSize: '34px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    // ===== DIFFICULTY =====
    this.add.text(W / 2, 150, 'DIFFICULTY', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    // Shows the gravity + fuel multipliers the active preset produces, so the
    // player can still see the underlying values (previously shown via sliders).
    this.diffInfoText = this.add.text(W / 2, 282, '', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 310, 'harder = stronger gravity, less fuel', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#666666'
    }).setOrigin(0.5);

    // ---- DOM controls (reliable on mobile) ----
    DOMUI.init();
    DOMUI.clear();

    let diff = this.registry.get('difficulty');
    if (!DIFFICULTIES[diff]) diff = DEFAULT_DIFFICULTY;

    // Apply a preset: push gravity + fuel into the registry (so the Game scene
    // picks them up unchanged) and remember the difficulty for next launch.
    const applyDifficulty = (d) => {
      const p = DIFFICULTIES[d];
      this.registry.set('difficulty', d);
      this.registry.set('gravity', p.gravity);
      this.registry.set('fuel', p.fuel);
      localStorage.setItem('ll_difficulty', d);
      this.diffInfoText.setText(
        'GRAVITY \u00d7' + p.gravity.toFixed(1) +
        '    FUEL \u00d7' + p.fuel.toFixed(1));
    };
    applyDifficulty(diff);

    // Three-way difficulty selector
    DOMUI.segmented(W / 2, 210, 280, 54, [
      { value: 'easy',   label: 'EASY' },
      { value: 'medium', label: 'MEDIUM' },
      { value: 'hard',   label: 'HARD' }
    ], diff, (v) => { applyDifficulty(v); Audio.click(); });

    // Sound toggle
    const refreshSound = () => {
      const muted = this.registry.get('mute') === true;
      this.soundBtn.el.textContent = 'SOUND: ' + (muted ? 'OFF' : 'ON');
    };
    this.soundBtn = DOMUI.tapButton(W / 2, 430, 220, 50, '', 18, () => {
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
