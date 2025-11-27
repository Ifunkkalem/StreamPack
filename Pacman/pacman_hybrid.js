let score = 0;
let running = false;

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
}

function collectDot() {
  if (squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    score++;
    scoreEl.innerText = score;
  }
}

/* D-PAD */
document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

/* ✅ START GAME → REQUEST KE PARENT (REAL TX SUDAH JALAN DI PARENT) */
document.getElementById("start-button").onclick = () => {
  window.parent.postMessage({ type: "REQUEST_START_GAME" }, "*");
};

/* ✅ TERIMA KONFIRMASI DARI PARENT */
window.addEventListener("message", (ev) => {
  const data = ev.data || {};
  if (data.type === "START_GAME_RESULT") {
    if (data.success) {
      running = true;
      alert("Game dimulai!");
    } else {
      alert("Pembayaran STT gagal.");
    }
  }
});

window.onload = () => createGrid();
