/* Game over / victory scene */
class GameOver extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    this.cameras.main.setBackgroundColor('#000000');
    DOMUI.clear();
    const W = this.scale.width, H = this.scale.height;
    Audio.setThrust(false);

    const win = !!data.win;
    const score = data.score || 0;
    const hi = this.registry.get('hiscore') || 0;
    const newHi = score > 0 && score >= hi;

    this.add.text(W / 2, 170, win ? 'MISSION\nCOMPLETE' : 'GAME\nOVER', {
      fontFamily: 'Courier New, monospace', fontSize: '40px', fontStyle: 'bold', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);

    this.add.text(W / 2, 320, 'SCORE\n' + pad(score), {
      fontFamily: 'Courier New, monospace', fontSize: '28px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);

    this.add.text(W / 2, 400,
      newHi ? '* NEW HI-SCORE *' : 'HI ' + pad(hi), {
        fontFamily: 'Courier New, monospace', fontSize: '16px',
        color: newHi ? '#ffffff' : '#666666', fontStyle: 'bold'
      }).setOrigin(0.5);

    DOMUI.tapButton(W / 2, 470, 240, 58, win ? 'PLAY AGAIN' : 'TRY AGAIN', 20, () => {
      Audio.click();
      this.scene.start('Game', { level: 1, lives: 3, score: 0 });
    });

    DOMUI.tapButton(W / 2, 540, 220, 52, 'MENU', 18, () => {
      Audio.click();
      this.scene.start('Menu');
    });
  }
}
