let running = false;
let score = 0;
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

/* ✅ POSISI PAKSA VALID */
let pacIndex = 22;
let ghostIndex = 23;

/* ✅ BUAT GRID */
function createGrid() {
  grid.innerHTML = "";
  squares = [];

  layout.forEach(cell => {
    const d = document.createElement("div");
    d.classList.add("cell");
    if (cell === 1) d.classList.add("wall");
    if (cell === 0) d.classList.add("dot");
    grid.appendChild(d);
    squares.push(d);
  });

  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");
}

/* ✅ PACMAN */
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

  if (squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    score++;
    scoreEl.innerText = score;
  }
}

/* ✅ GHOST AUTO GERAK */
function moveGhost() {
  if (!running) return;

  const directions = [-1, 1, -width, width];
  const dir = directions[Math.floor(Math.random() * directions.length)];
  const next = ghostIndex + dir;

  if (squares[next] && !squares[next].classList.contains("wall")) {
    squares[ghostIndex].classList.remove("ghost");
    ghostIndex = next;
    squares[ghostIndex].classList.add("ghost");
  }

  /* ✅ TABRAKAN */
  if (ghostIndex === pacIndex) {
    alert("GAME OVER");
    running = false;
  }
}

setInterval(moveGhost, 600);

/* ✅ CONTROL */
document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

/* ✅ START GAME */
document.getElementById("start-button").onclick = () => {
  running = true;
};

createGrid();
