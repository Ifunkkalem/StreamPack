/* pacman_hybrid.js — FINAL (iframe side) */

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
  1,1,1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
];

const grid = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");
let squares = [];
let pacIndex = 21;
let ghostIndex = 58;

function createGrid() {
  grid.innerHTML = "";
  squares = [];
  grid.style.gridTemplateColumns = `repeat(${width}, 14px)`;
  layout.forEach((cell, i) => {
    const d = document.createElement("div");
    d.className = "cell";
    if (cell === 1) d.classList.add("wall");
    if (cell === 0) d.classList.add("dot");
    grid.appendChild(d);
    squares.push(d);
  });
  // place pac & ghost
  if (squares[pacIndex]) squares[pacIndex].classList.add("pac");
  if (squares[ghostIndex]) squares[ghostIndex].classList.add("ghost");
  score = 0; updateScore();
}

function updateScore() { scoreEl.innerText = score; }

function movePac(dir) {
  if (!running) return;
  if (!squares[pacIndex]) return;
  squares[pacIndex].classList.remove("pac");
  let next = pacIndex;
  if (dir === "left") next--;
  if (dir === "right") next++;
  if (dir === "up") next -= width;
  if (dir === "down") next += width;
  if (squares[next] && !squares[next].classList.contains("wall")) pacIndex = next;
  squares[pacIndex].classList.add("pac");
  collectDot();
  checkGameOver();
}

function collectDot() {
  if (squares[pacIndex] && squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    score++;
    updateScore();
  }
}

function ghostMove() {
  if (!running) return;
  const dirs = [-1,1,-width,width];
  let best = ghostIndex, bestDist = Infinity;
  dirs.forEach(d => {
    const t = ghostIndex + d;
    if (!squares[t] || squares[t].classList.contains("wall")) return;
    const dist = Math.abs((t%width)-(pacIndex%width)) + Math.abs(Math.floor(t/width)-Math.floor(pacIndex/width));
    if (dist < bestDist) { bestDist = dist; best = t; }
  });
  if (squares[ghostIndex]) squares[ghostIndex].classList.remove("ghost");
  ghostIndex = best;
  if (squares[ghostIndex]) squares[ghostIndex].classList.add("ghost");
  checkGameOver();
}

function checkGameOver() {
  if (pacIndex === ghostIndex) {
    running = false; clearInterval(ghostInterval);
    alert("GAME OVER! Skor: " + score);
    // minta parent menyimpan di leaderboard (lokal parent)
    window.parent.postMessage({ type: "SOMNIA_POINT_EVENT", points: score }, "*");
    // otomatis request claim onchain (jika user ingin)
    // kita kirim REQUEST_CLAIM_SCORE agar parent menjalankan claimScore onchain
    window.parent.postMessage({ type: "REQUEST_CLAIM_SCORE", points: score }, "*");
    resetGame();
  } else {
    // check if all dots eaten
    const remainingDots = squares.filter(s => s.classList.contains("dot")).length;
    if (remainingDots === 0) {
      running = false; clearInterval(ghostInterval);
      alert("LEVEL COMPLETE! Skor: " + score);
      window.parent.postMessage({ type: "SOMNIA_POINT_EVENT", points: score }, "*");
      window.parent.postMessage({ type: "REQUEST_CLAIM_SCORE", points: score }, "*");
      resetGame();
    }
  }
}

function resetGame() {
  // reset positions and grid
  pacIndex = 21; ghostIndex = 58;
  createGrid();
  running = false;
  clearInterval(ghostInterval);
}

document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

document.getElementById("start-button").onclick = () => {
  // request parent to start game onchain (will trigger MetaMask)
  window.parent.postMessage({ type: "REQUEST_START_GAME" }, "*");
};

window.addEventListener("message", (ev) => {
  const data = ev.data || {};
  if (data.type === "START_GAME_RESULT") {
    if (data.success) {
      running = true;
      ghostInterval = setInterval(ghostMove, 400);
      alert("Pembayaran diterima. Game dimulai!");
    } else {
      alert("Pembayaran STT gagal/batal. Game tidak dimulai.");
    }
  }
  // claim result (informasi)
  if (data.type === "CLAIM_RESULT") {
    if (data.result && data.result.success) {
      alert("CLAIM berhasil on-chain. TX: " + (data.result.txHash || '').slice(0,14)+"...");
    } else {
      alert("CLAIM gagal atau dibatalkan.");
    }
  }
});

window.onload = () => createGrid();
