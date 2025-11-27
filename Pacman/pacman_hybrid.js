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
  1,1,1,0,1,1,1,1,1,2,2,1,1,1,1,1,0,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
];

const grid = document.getElementById("grid-container");
const scoreEl = document.getElementById("score");

let squares = [];
let pacIndex = 21;   // start pos (tweakable)
let ghostIndex = 65; // ghost start

function createGrid() {
  grid.innerHTML = "";
  squares = [];

  // set grid css columns in case css missing
  grid.style.gridTemplateColumns = `repeat(${width}, 14px)`;

  layout.forEach((cell, i) => {
    const d = document.createElement("div");
    d.classList.add("cell");
    if (cell === 1) d.classList.add("wall");
    if (cell === 0) d.classList.add("dot");
    grid.appendChild(d);
    squares.push(d);
  });

  // safety check indexes
  if (!squares[pacIndex]) pacIndex = 21;
  if (!squares[ghostIndex]) ghostIndex = 65;

  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");

  score = 0;
  scoreEl.innerText = 0;
}

function postToParent(msg) {
  try {
    window.parent.postMessage(msg, "*");
  } catch (e) {
    console.warn('postMessage failed', e);
  }
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

    // kirim event ke parent supaya tersimpan & ditampilkan
    postToParent({ type: "SOMNIA_POINT_EVENT", points: 1 });
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
    const dist = Math.abs((t % width) - (pacIndex % width)) +
                 Math.abs(Math.floor(t/width) - Math.floor(pacIndex/width));
    if (dist < bestDist) { bestDist = dist; best = t; }
  });
  squares[ghostIndex].classList.remove("ghost");
  ghostIndex = best;
  squares[ghostIndex].classList.add("ghost");
  if (ghostIndex === pacIndex) {
    // game over
    running = false;
    clearInterval(ghostInterval);
    alert("GAME OVER! Skor: " + score);
    // simpan skor di parent
    postToParent({ type: "SOMNIA_GAME_OVER", score });
    // reset grid
    setTimeout(() => {
      createGrid();
    }, 300);
  }
}

/* D-Pad & keyboard */
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") movePac("left");
  if (e.key === "ArrowRight") movePac("right");
  if (e.key === "ArrowUp") movePac("up");
  if (e.key === "ArrowDown") movePac("down");
});
document.getElementById("btn-up").onclick = () => movePac("up");
document.getElementById("btn-down").onclick = () => movePac("down");
document.getElementById("btn-left").onclick = () => movePac("left");
document.getElementById("btn-right").onclick = () => movePac("right");

/* START: kirim request ke parent untuk melakukan onchain start (bayar STT) */
document.getElementById("start-button").onclick = async () => {
  // kirim request ke parent agar parent memicu DreamWeb3.startGame()
  postToParent({ type: "REQUEST_START_GAME" });

  // tunggu respon START_GAME_RESULT dari parent (event listener di bawah) untuk mulai game.
  // sebagai fallback (jika parent tidak merespon dalam 6s), mulai juga.
  let started = false;
  function onResult(ev) {
    if (!ev.data) return;
    if (ev.data.type === 'START_GAME_RESULT') {
      started = true;
      if (ev.data.success) {
        running = true;
        ghostInterval = setInterval(ghostMove, 400);
      } else {
        alert('Transaksi start dibatalkan / gagal.');
      }
      window.removeEventListener('message', onResult);
    }
  }
  window.addEventListener('message', onResult);

  // fallback: jika parent tidak merespon dalam 5s -> jalankan local start (debug)
  setTimeout(() => {
    if (!started) {
      // fallback: mulai game tanpa onchain (debug)
      running = true;
      ghostInterval = setInterval(ghostMove, 400);
      console.warn('[iframe] fallback start (no parent response).');
    }
  }, 5000);
};

/* terima message dari parent (mis. START_GAME_RESULT atau CLAIM_RESULT) */
window.addEventListener("message", (ev) => {
  const d = ev.data || {};
  if (!d.type) return;

  if (d.type === 'START_GAME_RESULT') {
    if (d.success) {
      running = true;
      ghostInterval = setInterval(ghostMove, 400);
    } else {
      alert('Transaksi gagal / dibatalkan.');
    }
  }

  if (d.type === 'CLAIM_RESULT') {
    // parent memberikan hasil klaim reward onchain
    if (d.result && d.result.success) {
      alert('Klaim berhasil: ' + (d.result.amount || '0') + ' PAC');
    } else {
      alert('Klaim gagal: ' + (d.result?.error || 'unknown'));
    }
  }
});

/* inisialisasi grid saat load iframe */
window.onload = () => {
  createGrid();

  // kirim info ukuran iframe ke parent supaya parent bisa resize
  setTimeout(() => {
    postToParent({ type: 'PACMAN_RESIZE', height: document.body.scrollHeight });
  }, 200);
};
