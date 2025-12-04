/* app.js — FINAL parent (UI helpers, iframe bridge, leaderboard render) */

/* Utility to add activity log (assumes #activity exists) */
function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

/* Called by web3.js after successful connect */
window.afterWalletConnected = async function() {
  addActivity("[system] Wallet connected: " + (window.DreamWeb3 && window.DreamWeb3.address ? window.DreamWeb3.address : "unknown"));
  // start mock stream only if toggled
  if (document.getElementById("toggle-sim") && document.getElementById("toggle-sim").checked) {
    if (typeof startMockStream === "function") startMockStream();
  }
  // refresh top10 on connect
  await renderTop10();
};

/* Render top 10 leaderboard from on-chain contract */
async function renderTop10() {
  const listEl = document.getElementById("leaderboard-list");
  if (!listEl) return;
  listEl.innerHTML = "<li>Loading...</li>";
  const res = await DreamWeb3.fetchTop10();
  listEl.innerHTML = "";
  if (!res || !res.addrs || res.addrs.length === 0) {
    listEl.innerHTML = "<li>No entries</li>";
    return;
  }
  for (let i=0;i<res.addrs.length;i++) {
    const a = res.addrs[i];
    const s = res.scores[i] ? res.scores[i].toString() : "0";
    const li = document.createElement("li");
    li.innerText = `${i+1}. ${a} — ${s}`;
    listEl.appendChild(li);
  }
}

/* IFRAME -> PARENT messaging (receive) */
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  // iframe requests to start game -> Do on-chain startGame (pay fee) and reply START_GAME_RESULT
  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME received");
    const ok = await DreamWeb3.startGame();
    // reply to iframe
    const iframe = document.getElementById("pacman-iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "START_GAME_RESULT", success: !!ok }, "*");
    }
    addActivity("[onchain] startGame result: " + (ok ? "success" : "failed"));
  }

  // iframe requests to claim/submit score -> submitScore on-chain
  if (data.type === "REQUEST_CLAIM_SCORE") {
    const pts = Number(data.score || 0);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${pts}`);
    // call on-chain submitScore
    const res = await DreamWeb3.submitScore(pts);
    const iframe = document.getElementById("pacman-iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "CLAIM_RESULT", success: !!res.success, message: res.message || "" }, "*");
    }
    if (res && res.success) {
      addActivity(`[claim] ${DreamWeb3.address} +${pts} points submitted on-chain`);
      // refresh top10
      await renderTop10();
    } else {
      addActivity("[claim] submit failed: " + (res && res.message ? res.message : "unknown"));
    }
  }
});

/* Swap button: in this main design we don't allocate PAC; swap may be disabled.
   But keep handler in case you want to enable later */
document.getElementById("btn-swap") && (document.getElementById("btn-swap").onclick = async () => {
  const v = parseInt(document.getElementById("swap-input").value || "0");
  if (!v || v < 10 || v % 10 !== 0) {
    document.getElementById("swap-status").innerText = "Minimal 10 dan kelipatan 10.";
    return;
  }
  document.getElementById("swap-status").innerText = "Swap feature disabled in MAINNET release.";
});

/* init */
window.addEventListener("load", async () => {
  // attempt to show top10 quickly (will fail gracefully)
  try { await renderTop10(); } catch(e) {}
});
