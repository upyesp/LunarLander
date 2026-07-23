/* ============================================================
   Lunar Lander - Phaser game configuration & boot
   ============================================================ */

const GAME_W = 360;
const GAME_H = 640;

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
