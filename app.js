/* ========= GLOBAL STATE ========= */
let CURRENT_SCORE = 0;
let WALLET = null;

/* ========= WALLET READY HOOK ========= */
window.afterWalletConnected = function () {
  WALLET = window.DreamWeb3.address;
  loadLeaderboard();
};

/* ========= UI HELPERS ========= */
function uiStatus(msg) {
  const el = document.getElementById("swap-status");
  if (el) el.innerText = msg;
}

function addActivity(msg) {
  console.log(msg);
  const log = document.getElementById("debug-log");
  if (log) {
    const p = document.createElement("div");
    p.innerText = msg;
    log.prepend(p);
  }
}

/* ========= START GAME (FROM IFRAME) ========= */
window.addEventListener("message", async (ev) => {
  if (!ev.data || !ev.data.type) return;

  if (ev.data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME received");

    const ok = await DreamWeb3.startGame();
    if (ok) {
      window.frames[0].postMessage({ type: "START_GAME_RESULT", success: true }, "*");
      addActivity("[onchain] startGame result: success");
    } else {
      window.frames[0].postMessage({ type: "START_GAME_RESULT", success: false }, "*");
      alert("Pembayaran STT gagal/batal. Game tidak dimulai.");
    }
  }

  if (ev.data.type === "REQUEST_CLAIM_SCORE") {
    const score = parseInt(ev.data.score || 0);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${score}`);
    handleClaimScore(score);
  }
});

/* ========= CLAIM SCORE + LEADERBOARD ========= */
function handleClaimScore(score) {
  CURRENT_SCORE = score;

  let leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  // ✅ 1 wallet = 1 rank
  leaderboard = leaderboard.filter(r => r.wallet !== WALLET);

  leaderboard.push({
    wallet: WALLET,
    score: score,
    time: Date.now()
  });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 100);

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  document.getElementById("points").innerText = score;

  addActivity(`[claim] ${WALLET} +${score} points saved to leaderboard`);
}

/* ========= LOAD LEADERBOARD ========= */
function loadLeaderboard() {
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const el = document.getElementById("leaderboard");
  if (!el) return;

  el.innerHTML = "";
  data.forEach((r, i) => {
    const div = document.createElement("div");
    div.innerText = `${i + 1}. ${r.wallet.slice(0, 6)}...${r.wallet.slice(-4)} — ${r.score} pts`;
    el.appendChild(div);
  });
}

/* ========= SWAP HANDLER ========= */
document.getElementById("btn-swap").onclick = async () => {
  const input = document.getElementById("swap-input");
  const pts = parseInt(input.value || "0");

  if (!pts || pts < 10 || pts % 10 !== 0) {
    uiStatus("Minimal 10 dan kelipatan 10.");
    return;
  }

  if (!window.DreamWeb3 || !window.DreamWeb3.address) {
    uiStatus("Wallet belum terhubung.");
    return;
  }

  uiStatus("Processing swap...");

  const res = await window.DreamWeb3.requestSwap(pts);

  if (!res || !res.success) {
    uiStatus(res.message || "SWAP gagal atau dibatalkan.");
    addActivity("[swap] Swap gagal atau dibatalkan.");
    return;
  }

  // ✅ Kurangi score setelah swap request
  CURRENT_SCORE -= pts;
  if (CURRENT_SCORE < 0) CURRENT_SCORE = 0;
  document.getElementById("points").innerText = CURRENT_SCORE;

  uiStatus(`Swap sukses: ${res.pac} PAC (pending treasury)`);
  addActivity(`[swap] Request sukses → ${res.pac} PAC`);

  document.getElementById("swap-input").value = "";
};

/* ========= INITIAL LOAD ========= */
window.onload = () => {
  loadLeaderboard();
};
