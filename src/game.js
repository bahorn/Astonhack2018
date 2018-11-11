const utils = require('./utils');

function spawnLocation() { return { x: 0, z: 0 }; }
function assignPlayerType() { return ['dinosaur', 'unicorn'][Math.round(Math.random())]; }
function assignColor() { return utils.getRandomColor(); }
function randomCoords() {
  return {
    x: (Math.random() * 50) - 25,
    z: (Math.random() * 50) - 25,
  };
}

module.exports = {
  spawnLocation: spawnLocation,
  assignPlayerType: assignPlayerType,
  assignColor: assignColor,
  randomCoords: randomCoords,
};
