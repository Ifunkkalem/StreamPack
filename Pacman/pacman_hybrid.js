const grid = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");

let score = 0;
let running = false;

const width = 20;

const layout = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
];

let squares = [];
let pacIndex = 22;

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
}

function movePac(dir) {
  if (!running) return;

  squares[pacIndex].classList.remove("pac");

  if (dir === "left") pacIndex--;
  if (dir === "right") pacIndex++;
  if (dir === "up") pacIndex -= width;
  if (dir === "down") pacIndex += width;

  squares[pacIndex].classList.add("pac");
}

document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

document.getElementById("start-button").onclick = () => {
  running = true;
  alert("Game Start!");
};

window.onload = () => {
  createGrid();
};
