/* pacman_hybrid.js — iframe game (communicates with parent) */

let score = 0;
let running = false;
let ghostInterval = null;

const width = 20;
const layout = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,0,1,
  1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,
  1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,0,1,1,1,1,1,2,2,1,1,1,1,1,0,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
];

const gridContainer = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");

let squares = [];
let pacIndex = 20;
let ghostIndex = 60;

function createGrid() {
  gridContainer.innerHTML = "";
  squares = [];
  gridContainer.style.gridTemplateColumns = `repeat(${width}, 14px)`;

  for (let i=0;i<layout.length;i++){
    const div = document.createElement("div");
    div.className = "cell";
    if (layout[i] === 1) div.classList.add("wall");
    if (layout[i] === 0) div.classList.add("dot");
    gridContainer.appendChild(div);
    squares.push(div);
  }
  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");
  score = 0;
  scoreEl.innerText = score;
}

function movePac(dir) {
  if (!running) return;
  squares[pacIndex].classList.remove("pac");
  let next = pacIndex;
  if (dir === "left") next--;
  if (dir === "right") next++;
  if (dir === "up") next -= width;
  if (dir === "down") next += width;
  if (squares[next] && !squares[next].classList.contains("wall")) {
    pacIndex = next;
  }
  squares[pacIndex].classList.add("pac");
  collectDot();
  checkGameOver();
}

function collectDot() {
  if (squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    score++;
    scoreEl.innerText = score;
    // notify parent of points increment
    window.parent && window.parent.postMessage && window.parent.postMessage({
      type: "SOMNIA_POINT_EVENT",
      points: 1
    }, "*");
  }
}

function ghostMove() {
  if (!running) return;
  const dirs = [-1,1,-width,width];
  let best = ghostIndex;
  let bestDist = Infinity;
  dirs.forEach(d => {
    const t = ghostIndex + d;
    if (!squares[t] || squares[t].classList.contains("wall")) return;
    const dist = Math.abs((t%width)-(pacIndex%width)) + Math.abs(Math.floor(t/width)-Math.floor(pacIndex/width));
    if (dist < bestDist) { bestDist = dist; best = t; }
  });
  squares[ghostIndex].classList.remove("ghost");
  ghostIndex = best;
  squares[ghostIndex].classList.add("ghost");
  checkGameOver();
}

function checkGameOver() {
  if (pacIndex === ghostIndex) {
    running = false;
    clearInterval(ghostInterval);
    alert("GAME OVER! Skor: " + score);
    // submit to parent leaderboard (not on-chain)
    window.parent && window.parent.postMessage && window.parent.postMessage({
      type: "POINTS_SUBMIT",
      points: score
    }, "*");
    resetGame();
  }
}

function resetGame() {
  score = 0;
  scoreEl.innerText = 0;
  pacIndex = 20;
  ghostIndex = 60;
  createGrid();
}

document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

document.getElementById("start-button").onclick = () => {
  // minta parent untuk proses pembayaran on-chain
  window.parent && window.parent.postMessage && window.parent.postMessage({
    type: "REQUEST_START_GAME"
  }, "*");
};

// listen reply dari parent (start game result)
window.addEventListener("message", (ev) => {
  const d = ev.data || {};
  if (d.type === "START_GAME_RESULT") {
    if (d.ok) {
      running = true;
      ghostInterval = setInterval(ghostMove, 400);
    } else {
      alert("Pembayaran STT gagal — tidak bisa mulai game.");
    }
  }
});

window.onload = () => {
  createGrid();
};
