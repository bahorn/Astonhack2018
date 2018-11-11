/* eslint no-console: 0 */
const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const utils = require('./utils');
const game = require('./game');

const state = {
  players: {},
  score: {
    dinosaurs: 0,
    unicorns: 0,
  },
  point: {
    position: {
      x: 0,
      z: 0,
    },
  },
};

app.use('/static', express.static('src/static'));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/static/index.html`);
});

io.on('connection', (socket) => {
  const playerId = utils.uuid();
  console.log(`${playerId} : connected`);
  /* Add the new user */
  state.players[playerId] = {
    position: game.randomCoords(),
    name: playerId,
    score: 1,
    type: game.assignPlayerType(),
    color: game.assignColor(),
  };
  /* Deepcopy the state and modify it for this user */
  const userSpecificState = JSON.parse(JSON.stringify(state));
  userSpecificState.playerId = playerId;
  /* Send the latest state */
  socket.emit('state', userSpecificState);
  /* On disconnect, remove this users state */
  socket.on('disconnect', () => {
    console.log(`${playerId} : disconnected`);
    delete state.players[playerId];
    io.emit('disconnectedUser', { playerId: playerId });
  });
  socket.on('position', (event) => {
    /* Verify position */
    // check if the position is close enough to one of the goals.
    /* Update state and alert other users */
    socket.broadcast.emit('position', event);
  });
});

http.listen(3000, '0.0.0.0', () => {
  console.log('listening on *:3000');
});
