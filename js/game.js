

var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

var bg = new Image();
var needle = new Image();
var wedge = new Image();
var center = new Image();
var size = 800;

bg.src = "img/bg.png";
needle.src = "img/needle.png";
wedge.src = "img/wedge.png";
center.src = "img/center.png";

var nX = 10, nY = 10;
var wX = 765, wY = 765;
var cX = 392, cY = 392;
var gravity = 0.5;
function draw() {
  ctx.drawImage(bg, 0, 0);
  ctx.drawImage(needle, nX, nY);
  ctx.drawImage(wedge, wX, wY);
  ctx.drawImage(center, cX,cY);
  nX+=gravity;
  nY+=gravity;

  requestAnimationFrame(draw);
}

wedge.onload = draw;
