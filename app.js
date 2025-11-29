/* app.js — FINAL STABLE */

function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

/* ✅ DIPANGGIL SETELAH CONNECT */
window.afterWalletConnected = function () {
  addActivity("[system] Wallet connected: " + DreamWeb3.address);

  if (document.getElementById("toggle-sim")?.checked) {
    if (typeof startMockStream === "function") startMockStream();
  }
};

/* ✅ IFRAME COMMUNICATION */
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME received");

    const ok = await DreamWeb3.startGame();

    document.getElementById("pacman-iframe")?.contentWindow?.postMessage({
      type: "START_GAME_RESULT",
      success: !!ok
    }, "*");

    addActivity(ok ? "[onchain] startGame success" : "[onchain] startGame failed");
  }

  if (data.type === "REQUEST_CLAIM_SCORE") {
    const pts = Number(data.points || 0);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${pts}`);

    const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    lb.unshift({ wallet: DreamWeb3.address, score: pts });
    localStorage.setItem("leaderboard", JSON.stringify(lb));

    refreshLeaderboardUI();
  }
});

/* ✅ LEADERBOARD */
function refreshLeaderboardUI() {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  const total = lb.reduce((s, x) => s + (x.score || 0), 0);
  document.getElementById("my-total-score").innerText = total;

  const ul = document.getElementById("leaderboard-list");
  ul.innerHTML = "";

  lb.slice(0, 10).forEach((it, i) => {
    const li = document.createElement("li");
    li.innerText = `${i + 1}. ${it.score}`;
    ul.appendChild(li);
  });
}

refreshLeaderboardUI();

/* ✅ FINAL FIX TOMBOL SWAP – TX ONCHAIN */
document.getElementById("btn-swap")?.addEventListener("click", async () => {
  const pts = Number(document.getElementById("swap-input").value || 0);

  if (!pts || pts < 10) {
    alert("Minimal 10 point.");
    return;
  }

  addActivity(`[swap] Request swap ${pts}`);

  const res = await DreamWeb3.claimScore(pts);

  if (res.success) {
    addActivity(`[swap] ✅ SUCCESS TX: ${res.txHash}`);
    alert("SWAP BERHASIL! PAC akan masuk setelah konfirmasi.");
    refreshLeaderboardUI();
  } else {
    addActivity(`[swap] ❌ GAGAL`);
    alert("SWAP gagal atau dibatalkan.");
  }
});

/* ✅ CLEAR LOG */
document.getElementById("btn-clear")?.addEventListener("click", () => {
  document.getElementById("activity").innerHTML = "";
});
