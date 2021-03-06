'use strict';

import {gameManager} from './gameManager.js';

export let canvas = document.getElementById("canvasid");//находим canvas по id
export let ctx = canvas.getContext("2d"); //включаем 2d графику
export let div = document.createElement('div');
export let progress = [];
progress['player0'] = document.getElementById("player0");
progress['player1'] = document.getElementById("player1");
document.getElementById("text0").innerHTML = 'player0';
document.getElementById("text1").innerHTML = 'player1';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


gameManager.loadAll();
gameManager.play();