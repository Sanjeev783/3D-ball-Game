/**
 * main.js
 * Application entry point for Metal Ball Maze 3D
 */

import './src/styles/main.css';
import { Game } from './src/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (container) {
    const game = new Game(container);
    window.gameInstance = game;
  }
});
