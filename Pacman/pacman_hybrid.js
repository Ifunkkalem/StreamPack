/* pacman_hybrid.js — FINAL (iframe) */
/* Iframe tidak boleh akses wallet langsung.
   Semua request start/claim dikirim ke parent via postMessage.
*/

let score = 0;
let running = false;
let ghostInt = null;

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
let pacIndex = 20;
let ghostIndex = 60;

function createGrid(){
  grid.innerHTML = "";
  squares = [];
  layout.forEach((c,i)=>{
    const d = document.createElement("div");
    d.className = "cell";
    if (c === 1) d.classList.add("wall");
    if (c === 0) d.classList.add("dot");
    grid.appendChild(d);
    squares.push(d);
  });
  squares[pacIndex].classList.add("pac");
  squares[ghostIndex].classList.add("ghost");
  score = 0; scoreEl.innerText = 0;
  running = false;
}

function movePac(dir){
  if (!running) return;
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

function collectDot(){
  if (squares[pacIndex].classList.contains("dot")){
    squares[pacIndex].classList.remove("dot");
    score++;
    scoreEl.innerText = score;
  }
}

function ghostMove(){
  if (!running) return;
  const dirs = [-1,1,-width,width];
  let best = ghostIndex; let bestD=1e9;
  dirs.forEach(d=>{
    const t = ghostIndex + d;
    if (!squares[t] || squares[t].classList.contains("wall")) return;
    const dist = Math.abs((t%width)-(pacIndex%width)) + Math.abs(Math.floor(t/width)-Math.floor(pacIndex/width));
    if (dist < bestD){ bestD=dist; best=t; }
  });
  squares[ghostIndex].classList.remove("ghost");
  ghostIndex = best;
  squares[ghostIndex].classList.add("ghost");
  checkGameOver();
}

function checkGameOver(){
  if (pacIndex === ghostIndex){
    running = false;
    clearInterval(ghostInt);
    alert("GAME OVER! Skor: " + score);
    // send point event to parent (saved to leaderboard in parent)
    window.parent.postMessage({ type: "SOMNIA_POINT_EVENT", points: score }, "*");
    // Game resets but player may choose to claim later
    createGrid();
  }
}

/* D-PAD */
document.getElementById("btn-up").onclick = ()=>movePac("up");
document.getElementById("btn-down").onclick = ()=>movePac("down");
document.getElementById("btn-left").onclick = ()=>movePac("left");
document.getElementById("btn-right").onclick = ()=>movePac("right");

/* Start Game -> request parent to do on-chain tx */
document.getElementById("start-button").onclick = () => {
  // send request to parent
  window.parent.postMessage({ type: "REQUEST_START_GAME" }, "*");
  // show pending UI
  document.getElementById("txStatus").innerText = "Waiting for on-chain start tx...";
};

/* Claim score button (you may add a separate button in iframe markup) */
function claimScoreOnChain() {
  if (score <= 0) { alert("Tidak ada skor untuk diklaim."); return; }
  window.parent.postMessage({ type: "REQUEST_CLAIM_SCORE", points: score }, "*");
  document.getElementById("txStatus").innerText = "Waiting for claim tx...";
}

/* Listen for parent replies */
window.addEventListener("message", (ev) => {
  const d = ev.data || {};
  if (!d.type) return;
  if (d.type === "START_GAME_RESULT") {
    if (d.success) {
      document.getElementById("txStatus").innerText = "Start TX OK — game dimulai";
      running = true;
      ghostInt = setInterval(ghostMove, 400);
    } else {
      document.getElementById("txStatus").innerText = "Start TX gagal/canceled.";
      running = false;
    }
  }
  if (d.type === "CLAIM_RESULT") {
    const r = d.result || {};
    if (r.success) {
      document.getElementById("txStatus").innerText = `Claim success: ${r.txHash}`;
      // reset local score after successful claim
      score = 0; scoreEl.innerText = 0;
      createGrid();
    } else {
      document.getElementById("txStatus").innerText = `Claim failed: ${r.err?.message||r.err||'unknown'}`;
    }
  }
});

/* optional: attach a small claim button inside iframe UI if you want */
const claimBtn = document.createElement("button");
claimBtn.innerText = "Claim Score On-Chain (0.001 STT fee)";
claimBtn.style.marginTop = "6px";
claimBtn.onclick = claimScoreOnChain;
document.body.appendChild(claimBtn);

window.onload = createGrid;
