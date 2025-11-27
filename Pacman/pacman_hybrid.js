/* pacman_hybrid.js — FINAL SYNCED WITH IFRAME */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let running = false;
let score = 0;

let pacman = { x: 40, y: 40, vx: 0, vy: 0 };
let dots = [];

// generate dots
for (let i = 0; i < 25; i++) {
  dots.push({
    x: Math.random() * (canvas.width - 10),
    y: Math.random() * (canvas.height - 10),
    r: 4,
    eaten: false
  });
}

function drawPacman() {
  ctx.beginPath();
  ctx.arc(pacman.x, pacman.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();
}

function drawDots() {
  dots.forEach(d => {
    if (!d.eaten) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = "#0f0";
      ctx.fill();
    }
  });
}

function checkCollisions() {
  dots.forEach(d => {
    const dx = pacman.x - d.x;
    const dy = pacman.y - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10 && !d.eaten) {
      d.eaten = true;
      score++;
      document.getElementById("score").innerText = score;

      // kirim point ke parent
      window.parent.postMessage({
        type: "SOMNIA_POINT_EVENT",
        points: 1
      }, "*");
    }
  });
}

function update() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pacman.x += pacman.vx;
  pacman.y += pacman.vy;

  // batas tembok
  if (pacman.x < 8) pacman.x = 8;
  if (pacman.y < 8) pacman.y = 8;
  if (pacman.x > canvas.width - 8) pacman.x = canvas.width - 8;
  if (pacman.y > canvas.height - 8) pacman.y = canvas.height - 8;

  drawDots();
  drawPacman();
  checkCollisions();

  // GAME OVER jika semua dot habis
  if (dots.every(d => d.eaten)) {
    running = false;
    window.parent.postMessage({
      type: "GAME_OVER",
      finalScore: score
    }, "*");
  }

  requestAnimationFrame(update);
}

/* KEYBOARD CONTROL */
document.addEventListener("keydown", (e) => {
  if (!running && e.key === "Enter") {
    // minta izin start dari parent (Web3)
    window.parent.postMessage({
      type: "REQUEST_START_GAME"
    }, "*");
    return;
  }

  if (!running) return;

  if (e.key === "ArrowUp")    { pacman.vx = 0; pacman.vy = -2; }
  if (e.key === "ArrowDown")  { pacman.vx = 0; pacman.vy = 2; }
  if (e.key === "ArrowLeft")  { pacman.vx = -2; pacman.vy = 0; }
  if (e.key === "ArrowRight") { pacman.vx = 2; pacman.vy = 0; }
});

/* LISTEN RESULT DARI PARENT */
window.addEventListener("message", (ev) => {
  const data = ev.data || {};

  if (data.type === "START_GAME_RESULT") {
    if (data.success) {
      running = true;
      requestAnimationFrame(update);
    } else {
      alert("Start game gagal (TX ditolak)");
    }
  }
});
