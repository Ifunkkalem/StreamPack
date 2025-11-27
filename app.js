/* app.js — FINAL STABLE */

function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

window.afterWalletConnected = function () {
  if (document.getElementById("toggle-sim")?.checked) {
    if (typeof startMockStream === "function") startMockStream();
  }
  if (window.DreamWeb3) DreamWeb3.refreshBalances();
  addActivity("[system] Wallet connected");
};

// ✅ TERIMA PESAN DARI GAME
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  // START GAME
  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] Start Game Requested");
    const ok = await DreamWeb3.startGame();
    ev.source.postMessage({ type: "START_GAME_RESULT", success: !!ok }, "*");
  }

  // CLAIM SCORE
  if (data.type === "REQUEST_CLAIM_SCORE") {
    const pts = Number(data.points || 0);
    addActivity(`[iframe] Claim ${pts} points`);

    const res = await DreamWeb3.claimScore(pts);

    // Simpan leaderboard local
    const prev = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    prev.unshift({ score: pts, time: Date.now() });
    localStorage.setItem("leaderboard", JSON.stringify(prev));

    refreshLeaderboardUI();

    ev.source.postMessage({ type: "CLAIM_RESULT", result: res }, "*");
  }
});

// ✅ LEADERBOARD UI
function refreshLeaderboardUI() {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  document.getElementById("my-total-score").innerText =
    lb.reduce((s, x) => s + (x.score || 0), 0);

  const ul = document.getElementById("leaderboard-list");
  ul.innerHTML = "";
  lb.slice(0, 10).forEach((it, i) => {
    const li = document.createElement("li");
    li.innerText = `${i + 1}. ${it.score}`;
    ul.appendChild(li);
  });
}

refreshLeaderboardUI();
