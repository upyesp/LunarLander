/* Boot scene - load persisted settings, then go to the menu */
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const hi = parseInt(localStorage.getItem('ll_hiscore') || '0', 10) || 0;

    // Difficulty is the single source of truth for gravity + fuel. A fresh
    // launch (nothing saved, or a garbage value) falls back to medium, which
    // also keeps gravity/fuel consistent with the chosen preset.
    let diff = localStorage.getItem('ll_difficulty');
    if (!DIFFICULTIES[diff]) diff = DEFAULT_DIFFICULTY;
    const preset = DIFFICULTIES[diff];

    const m = localStorage.getItem('ll_mute') === '1';

    this.registry.set('hiscore', hi);
    this.registry.set('difficulty', diff);
    this.registry.set('gravity', preset.gravity);
    this.registry.set('fuel', preset.fuel);
    this.registry.set('mute', m);
    Audio.setMuted(m);

    this.scene.start('Menu');
  }
}
