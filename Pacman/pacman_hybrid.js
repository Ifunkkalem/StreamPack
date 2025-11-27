let score = 0;
let running = false;
let ghostTimer = null;

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

/* ================= GRID ================= */

function createGrid() {
  grid.innerHTML = "";
  squares = [];

  layout.forEach((cell) => {
    const d = document.createElement("div");
    d.classList.add("cell");

    if (cell === 1) d.classList.add("wall");
    if (cell === 0) d.classList.add("dot");

    grid.appendChild(d);
    squares.push(d);
  });

  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");

  score = 0;
  scoreEl.innerText = "0";
}

/* ================= PACMAN ================= */

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
  }
}

/* ================= GHOST ================= */

function moveGhost() {
  if (!running) return;

  const directions = [-1, 1, -width, width];
  let dir = directions[Math.floor(Math.random() * directions.length)];
  let next = ghostIndex + dir;

  if (!squares[next] || squares[next].classList.contains("wall")) return;

  squares[ghostIndex].classList.remove("ghost");
  ghostIndex = next;
  squares[ghostIndex].classList.add("ghost");

  checkGameOver();
}

/* ================= GAME OVER / WIN ================= */

function checkGameOver() {
  // kena ghost
  if (pacIndex === ghostIndex) {
    endGame(false);
  }

  // semua dot habis → menang
  if (!squares.some(s => s.classList.contains("dot"))) {
    endGame(true);
  }
}

function endGame(win) {
  running = false;
  clearInterval(ghostTimer);

  // kirim score ke parent (dashboard)
  if (window.parent) {
    window.parent.postMessage({
      type: "REQUEST_CLAIM_SCORE",
      points: score,
      win: win
    }, "*");
  }

  alert(win ? "YOU WIN!" : "GAME OVER!");

  setTimeout(() => {
    resetGame();
  }, 1200);
}

function resetGame() {
  score = 0;
  scoreEl.innerText = "0";
  pacIndex = 21;
  ghostIndex = 58;
  createGrid(); // RESET MAP
}

/* ================= CONTROL ================= */

document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

/* ================= START GAME ================= */

document.getElementById("start-button").onclick = () => {
  window.parent.postMessage({ type: "REQUEST_START_GAME" }, "*");
};

window.addEventListener("message", (ev) => {
  const data = ev.data || {};
  if (data.type === "START_GAME_RESULT") {
    if (data.success) {
      running = true;
      ghostTimer = setInterval(moveGhost, 450);
      alert("Game dimulai!");
    } else {
      alert("Pembayaran STT gagal.");
    }
  }
});

/* ================= INIT ================= */

window.onload = () => createGrid();
