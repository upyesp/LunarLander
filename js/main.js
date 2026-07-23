/* ============================================================
   Lunar Lander - Phaser game configuration & boot
   (GAME_W / GAME_H are defined in util.js)
   ============================================================ */

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#000000',
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 4 // allow simultaneous multi-touch (rotate + thrust)
  },
  scene: [Boot, Menu, Settings, Game, GameOver]
};

window.addEventListener('load', function () {
  window.game = new Phaser.Game(config);
});
