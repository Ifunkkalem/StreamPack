/* Pacman/pacman_hybrid.js — FINAL (iframe game) */
/* Requirements: this file runs inside iframe. Parent page handles on-chain txs. */

const WIDTH = 20;
const HEIGHT = 16;

// layout: 20x16 flattened. 0 = dot, 1 = wall, 2 = empty/spawn, 3 = big dot (power)
const MAP = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,
  1,3,1,2,1,0,1,2,0,0,0,0,0,2,1,0,1,2,3,1,
  1,0,1,2,1,0,1,2,1,1,1,1,1,2,1,0,1,2,0,1,
  1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,
  1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
  1,0,0,0,0,2,0,0,0,1,1,0,0,0,2,0,0,0,0,1,
  1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,0,1,
  1,3,0,0,1,0,0,0,0,2,2,0,0,0,0,0,1,0,3,1,
  1,0,0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
];

const gridEl = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("start-button");

let squares = [];
let pacIndex = 21;    // initial pac spawn (tweak if needed)
let ghostIndex = 58;  // initial ghost spawn
let running = false;
let ghostTimer = null;
let ghostSpeed = 450; // ms
let score = 0;

// build grid DOM
function createGrid() {
  gridEl.innerHTML = "";
  squares = [];
  // ensure grid css uses grid-template-columns: repeat(20,...)
  for (let i = 0; i < MAP.length; i++) {
    const d = document.createElement("div");
    d.className = "cell";
    const v = MAP[i];
    if (v === 1) d.classList.add("wall");
    if (v === 0) d.classList.add("dot");
    if (v === 3) {
      d.classList.add("dot");
      d.classList.add("big");
    }
    gridEl.appendChild(d);
    squares.push(d);
  }
  // place player + ghost
  pacIndex = pacIndex % MAP.length;
  ghostIndex = ghostIndex % MAP.length;
  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");
  score = 0;
  scoreEl.innerText = score;
}

// movement helpers
function isWall(idx) {
  return !squares[idx] ? true : squares[idx].classList.contains("wall");
}

function collectDot() {
  if (!squares[pacIndex]) return;
  if (squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    // big dot has different scoring (check class 'big')
    const gained = squares[pacIndex].classList.contains("big") ? 20 : 4;
    score += gained;
    scoreEl.innerText = score;
  }
}

function movePac(dir) {
  if (!running) return;
  if (!squares[pacIndex]) return;
  squares[pacIndex].classList.remove("pac");
  let next = pacIndex;
  if (dir === "left") next--;
  if (dir === "right") next++;
  if (dir === "up") next -= WIDTH;
  if (dir === "down") next += WIDTH;

  if (!squares[next] || isWall(next)) {
    // blocked
  } else {
    pacIndex = next;
  }
  if (squares[pacIndex]) squares[pacIndex].classList.add("pac");
  collectDot();
  checkDotCleared();
  checkCollision();
}

// simple Manhattan heuristic chase
function manhattan(a, b) {
  const ax = a % WIDTH, ay = Math.floor(a / WIDTH);
  const bx = b % WIDTH, by = Math.floor(b / WIDTH);
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function ghostStep() {
  if (!running) return;
  const dirs = [-1,1,-WIDTH,WIDTH];
  let best = ghostIndex;
  let bestDist = Infinity;
  for (const d of dirs) {
    const t = ghostIndex + d;
    if (!squares[t]) continue;
    if (isWall(t)) continue;
    // avoid immediate backtracking randomness (but keep simple)
    const dist = manhattan(t, pacIndex);
    if (dist < bestDist) {
      bestDist = dist;
      best = t;
    }
  }
  // move ghost
  if (squares[ghostIndex]) squares[ghostIndex].classList.remove("ghost");
  ghostIndex = best;
  if (squares[ghostIndex]) squares[ghostIndex].classList.add("ghost");
  checkCollision();
}

// check if pac eats all dots -> end game success
function checkDotCleared() {
  for (let i=0;i<squares.length;i++) {
    if (squares[i].classList.contains("dot")) return false;
  }
  // all dots cleared
  endGame(true);
  return true;
}

// check collision pac vs ghost
function checkCollision() {
  if (pacIndex === ghostIndex) {
    endGame(false);
  }
}

// end game flow: success(boolean) - send score to parent (parent will call submit)
function endGame(cleared) {
  running = false;
  if (ghostTimer) { clearInterval(ghostTimer); ghostTimer = null; }
  // store local UI; then prompt parent to claim
  const msg = { type: "REQUEST_CLAIM_SCORE", score: score };
  // send to parent (parent will perform on-chain submit)
  window.parent.postMessage(msg, "*");
  // show basic alert to user inside iframe
  if (cleared) {
    alert("YOU WIN! Skor: " + score + "\nMengirim skor ke dashboard...");
  } else {
    alert("GAME OVER! Skor: " + score + "\nMengirim skor ke dashboard...");
  }
  // reset visuals for next game
  resetGrid();
}

function resetGrid() {
  createGrid();
  running = false;
  if (ghostTimer) { clearInterval(ghostTimer); ghostTimer = null; }
}

// D-PAD bindings (buttons must exist in iframe)
document.addEventListener("DOMContentLoaded", () => {
  createGrid();
  const up = document.getElementById("btn-up");
  const down = document.getElementById("btn-down");
  const left = document.getElementById("btn-left");
  const right = document.getElementById("btn-right");

  up && up.addEventListener("click", () => movePac("up"));
  down && down.addEventListener("click", () => movePac("down"));
  left && left.addEventListener("click", () => movePac("left"));
  right && right.addEventListener("click", () => movePac("right"));

  // keyboard arrows
  window.addEventListener("keyup", (e) => {
    if (!running) return;
    if (e.key === "ArrowLeft") movePac("left");
    if (e.key === "ArrowRight") movePac("right");
    if (e.key === "ArrowUp") movePac("up");
    if (e.key === "ArrowDown") movePac("down");
  });
});

// Start button: request parent to run on-chain startGame (user must sign)
startBtn && startBtn.addEventListener("click", () => {
  // send request to parent
  window.parent.postMessage({ type: "REQUEST_START_GAME" }, "*");
});

// receive parent responses (tx result, claim result)
window.addEventListener("message", (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  if (data.type === "START_GAME_RESULT") {
    if (data.success) {
      // start local game
      running = true;
      if (ghostTimer) clearInterval(ghostTimer);
      ghostTimer = setInterval(ghostStep, ghostSpeed);
      // small UX
      alert("Pembayaran diterima. Game dimulai!");
    } else {
      alert("Pembayaran gagal / dibatalkan. Game tidak dimulai.");
    }
  }

  if (data.type === "CLAIM_RESULT") {
    if (data.success) {
      alert("Skor berhasil di-submit on-chain. Terima kasih!");
    } else {
      alert("Submit skor gagal: " + (data.message || "unknown"));
    }
  }
});
