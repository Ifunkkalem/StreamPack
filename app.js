/* app.js — FINAL PARENT BRIDGE + LEADERBOARD */

function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

/* ✅ Setelah wallet connect */
window.afterWalletConnected = function () {
  if (typeof DreamWeb3 !== "undefined") {
    DreamWeb3.refreshBalances();
  }
  addActivity("[system] Wallet connected & balances refreshed");
};

/* =========================================================
   ✅ IFRAME ↔ PARENT BRIDGE (START GAME + CLAIM)
========================================================= */
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  const iframe = document.getElementById("pacman-iframe");

  /* ✅ START GAME (TX 0.01 STT) */
  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME received");

    const ok = await DreamWeb3.startGame();

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "START_GAME_RESULT", success: !!ok },
        "*"
      );
    }
  }

  /* ✅ CLAIM SCORE → SIMPAN KE LEADERBOARD */
  if (data.type === "REQUEST_CLAIM_SCORE") {
    const pts = Number(data.points || 0);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${pts}`);

    saveScoreToLeaderboard(DreamWeb3.address, pts);

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "CLAIM_RESULT", success: true },
        "*"
      );
    }
  }
});

/* =========================================================
   ✅ LEADERBOARD = 1 WALLET = 1 RANK (AKUMULASI)
========================================================= */
function saveScoreToLeaderboard(wallet, score) {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  let user = lb.find(x => x.wallet === wallet);

  if (!user) {
    user = { wallet, score: 0 };
    lb.push(user);
  }

  user.score += score;

  localStorage.setItem("leaderboard", JSON.stringify(lb));
  addActivity(`[claim] ${wallet} +${score} points saved`);
  refreshLeaderboardUI();
}

/* =========================================================
   ✅ TAMPILKAN LEADERBOARD & TOTAL POINT USER
========================================================= */
function refreshLeaderboardUI() {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  // sort descending
  lb.sort((a, b) => b.score - a.score);

  // tampilkan total poin user aktif
  if (DreamWeb3 && DreamWeb3.address) {
    const me = lb.find(x => x.wallet === DreamWeb3.address);
    const total = me ? me.score : 0;
    const el = document.getElementById("my-total-score");
    if (el) el.innerText = total.toString();
  }

  // Top 10
  const ul = document.getElementById("leaderboard-list");
  if (!ul) return;
  ul.innerHTML = "";

  lb.slice(0, 10).forEach((it, i) => {
    const li = document.createElement("li");
    li.innerText = `${i + 1}. ${it.wallet.slice(0, 6)}...${it.wallet.slice(-4)} — ${it.score}`;
    ul.appendChild(li);
  });
}

refreshLeaderboardUI();

/* =========================================================
   ✅ AUTO SWAP VIA DASHBOARD (USER BAYAR GAS 0.001 STT)
========================================================= */
async function doSwapFromDashboard() {
  const input = document.getElementById("swap-input");
  const status = document.getElementById("swap-status");

  const v = parseInt(input.value || "0");
  if (!v || v < 10 || v % 10 !== 0) {
    status.innerText = "Minimal 10 & kelipatan 10.";
    return;
  }

  status.innerText = "Menunggu konfirmasi wallet...";
  addActivity(`[ui] Request swap ${v} point → PAC`);

  const res = await DreamWeb3.swapScoreOnchain(v);

  if (res.success) {
    status.innerText = "✅ Swap berhasil & tercatat on-chain!";
    addActivity("[swap] On-chain success: " + res.txHash);

    // kurangi dari leaderboard lokal
    const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    const me = lb.find(x => x.wallet === DreamWeb3.address);
    if (me) me.score -= v;
    localStorage.setItem("leaderboard", JSON.stringify(lb));

    refreshLeaderboardUI();
  } else {
    status.innerText = "❌ Swap gagal / dibatalkan.";
  }
}
