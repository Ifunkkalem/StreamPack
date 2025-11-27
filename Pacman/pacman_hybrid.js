/* pacman_hybrid.js — FULL REAL PACMAN + AUTO ONCHAIN CLAIM */

const grid = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");

const width = 20;
let score = 0;
let running = false;
let totalDots = 0;
let pacIndex = 210;
let ghostIndex = 188;
let ghostTimer = null;

const layout = [
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,
1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1,
1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,
1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
];

let squares = [];

/* ✅ SPAWN AMAN (FIX UTAMA) */
let pacIndex = 22;    // PASTI DOT
let ghostIndex = 116; // PASTI DOT

function createGrid() {
  grid.innerHTML = "";
  squares = [];
  totalDots = 0;

  layout.forEach((cell) => {
    const d = document.createElement("div");
    d.classList.add("cell");

    if (cell === 1) d.classList.add("wall");
    if (cell === 0) {
      d.classList.add("dot");
      totalDots++;
    }

    grid.appendChild(d);
    squares.push(d);
  });

  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");

  score = 0;
  scoreEl.innerText = "0";
}

/* GERAK PACMAN */
function movePac(dir) {
  if (!running) return;

  squares[pacIndex].classList.remove("pac");
  let next = pacIndex;

  if (dir === "left") next--;
  if (dir === "right") next++;
  if (dir === "up") next -= width;
  if (dir === "down") next += width;

  if (!squares[next] || squares[next].classList.contains("wall")) {
    squares[pacIndex].classList.add("pac");
    return;
  }

  pacIndex = next;
  squares[pacIndex].classList.add("pac");

  collectDot();
  checkGhostHit();
}

/* DOT */
function collectDot() {
  if (squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    score++;
    totalDots--;
    scoreEl.innerText = score;

    if (totalDots === 0) gameWin();
  }
}

/* GHOST GERAK */
function moveGhost() {
  const dirs = [-1, 1, -width, width];
  const dir = dirs[Math.floor(Math.random() * dirs.length)];
  const next = ghostIndex + dir;

  if (!squares[next].classList.contains("wall")) {
    squares[ghostIndex].classList.remove("ghost");
    ghostIndex = next;
    squares[ghostIndex].classList.add("ghost");
  }

  checkGhostHit();
}

/* TABRAKAN */
function checkGhostHit() {
  if (pacIndex === ghostIndex) gameOver();
}

/* GAME OVER */
function gameOver() {
  running = false;
  clearInterval(ghostTimer);
  alert("👻 GAME OVER!");
}

/* GAME WIN → AUTO CLAIM */
function gameWin() {
  running = false;
  clearInterval(ghostTimer);

  parent.postMessage({
    type: "REQUEST_CLAIM_SCORE",
    points: score
  }, "*");
}

/* CONTROL BUTTON */
document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

/* START GAME → ONCHAIN FEE */
document.getElementById("start-button").onclick = () => {
  parent.postMessage({ type: "REQUEST_START_GAME" }, "*");
};

/* RESPON TX RESULT */
window.addEventListener("message", (ev) => {
  if (ev.data?.type === "START_GAME_RESULT" && ev.data.success) {
    running = true;
    ghostTimer = setInterval(moveGhost, 600);
  }
});

/* INIT */
createGrid();
