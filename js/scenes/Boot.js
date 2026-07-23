/* Boot scene - load persisted settings, then go to the menu */
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const hi = parseInt(localStorage.getItem('ll_hiscore') || '0', 10) || 0;
    let g = parseFloat(localStorage.getItem('ll_gravity'));
    if (isNaN(g)) g = 1.0;
    const m = localStorage.getItem('ll_mute') === '1';

    this.registry.set('hiscore', hi);
    this.registry.set('gravity', g);
    this.registry.set('mute', m);
    Audio.setMuted(m);

    this.scene.start('Menu');
  }
}
