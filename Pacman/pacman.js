let score = 0;
let pacIndex = 22;
const width = 20;
let running = false;

const layout = [
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,
1,0,1,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,0,1,
1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,
1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
];

const grid = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");
const lock = document.getElementById("lock-screen");
const gameUI = document.getElementById("game-ui");

const squares = [];

function createGrid() {
  grid.innerHTML = "";
  layout.forEach(cell => {
    const d = document.createElement("div");
    d.classList.add("cell");
    if (cell === 1) d.classList.add("wall");
    if (cell === 0) d.classList.add("dot");
    grid.appendChild(d);
    squares.push(d);
  });
  squares[pacIndex].classList.add("pac");
}

function move(dir) {
  if (!running) return;
  squares[pacIndex].classList.remove("pac");

  if (dir === "left") pacIndex -= 1;
  if (dir === "right") pacIndex += 1;
  if (dir === "up") pacIndex -= width;
  if (dir === "down") pacIndex += width;

  if (squares[pacIndex].classList.contains("wall")) {
    if (dir === "left") pacIndex += 1;
    if (dir === "right") pacIndex -= 1;
    if (dir === "up") pacIndex += width;
    if (dir === "down") pacIndex -= width;
  }

  if (squares[pacIndex].classList.contains("dot")) {
    squares[pacIndex].classList.remove("dot");
    score++;
    scoreEl.innerText = score;
  }

  squares[pacIndex].classList.add("pac");
}

/* D-PAD */
document.getElementById("btn-up").onclick = () => move("up");
document.getElementById("btn-down").onclick = () => move("down");
document.getElementById("btn-left").onclick = () => move("left");
document.getElementById("btn-right").onclick = () => move("right");

/* ✅ UNLOCK SYSTEM */
function checkUnlock() {
  if (localStorage.getItem("GAME_UNLOCKED") === "1") {
    lock.style.display = "none";
    gameUI.style.display = "block";
    running = true;
    createGrid();
  }
}

checkUnlock();
