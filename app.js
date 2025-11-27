/* app.js — FINAL parent (iframe bridge + UI helpers) */

function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

// dipanggil oleh web3.js setelah connect sukses
window.afterWalletConnected = function() {
  // aktifkan mock stream hanya setelah wallet connect
  if (document.getElementById("toggle-sim") && document.getElementById("toggle-sim").checked) {
    if (typeof startMockStream === "function") startMockStream();
  }
  // refresh UI balances
  if (typeof DreamWeb3 !== "undefined") DreamWeb3.refreshBalances();
  addActivity("[system] Wallet connected - mock stream enabled (if toggled)");
};

// iframe ↔ parent messaging
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  // start game request from iframe
  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME");
    const ok = await DreamWeb3.startGame();
    // reply to iframe
    const iframe = document.getElementById("pacman-iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "START_GAME_RESULT", success: !!ok }, "*");
    }
  }

  // claim request from iframe: { type: "REQUEST_CLAIM_SCORE", points: N }
  if (data.type === "REQUEST_CLAIM_SCORE") {
    const pts = Number(data.points || 0);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${pts}`);
    const res = await DreamWeb3.claimScore(pts);
    const iframe = document.getElementById("pacman-iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "CLAIM_RESULT", result: res }, "*");
    }
  }
});

// update leaderboard UI helper
function refreshLeaderboardUI() {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  document.getElementById("my-total-score").innerText = (lb.reduce((s, x)=>s+(x.score||0),0)).toString();
  const ul = document.getElementById("leaderboard-list");
  if (!ul) return;
  ul.innerHTML = "";
  lb.slice(0, 10).forEach((it, i) => {
    const li = document.createElement("li");
    li.innerText = `${i+1}. ${it.score}`;
    ul.appendChild(li);
  });
}
refreshLeaderboardUI();
