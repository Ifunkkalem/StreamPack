/* app.js — FINAL parent glue */

function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

// called after connect in web3.js
window.afterWalletConnected = function() {
  addActivity("[system] Wallet connected");
  if (document.getElementById("toggle-sim") && document.getElementById("toggle-sim").checked) {
    if (typeof startMockStream === "function") startMockStream();
  }
  if (typeof DreamWeb3 !== "undefined") DreamWeb3.refreshBalances();
  refreshLeaderboardUI();
};

// IFRAME <-> parent messaging
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME");
    const ok = await DreamWeb3.startGame();
    const iframe = document.getElementById("pacman-iframe");
    if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: "START_GAME_RESULT", success: !!ok }, "*");
    addActivity(`[onchain] startGame result: ${ok ? "success" : "failed"}`);
  }

  if (data.type === "REQUEST_CLAIM_SCORE") {
    const pts = Number(data.points||0);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${pts}`);
    // store leaderboard: one wallet => one aggregated score
    const lb = JSON.parse(localStorage.getItem("leaderboard")||"{}");
    const addr = (DreamWeb3 && DreamWeb3.address) ? DreamWeb3.address : "offline";
    if (!lb[addr]) lb[addr] = 0;
    lb[addr] = lb[addr] + pts;
    localStorage.setItem("leaderboard", JSON.stringify(lb));
    addActivity(`[claim] ${addr} +${pts} points saved to leaderboard`);
    refreshLeaderboardUI();
  }
});

// swap button
const btnSwap = document.getElementById("btn-swap");
if (btnSwap) {
  btnSwap.onclick = async () => {
    const val = Number(document.getElementById("swap-input").value || 0);
    if (!val || val < 10 || val % window.SWAP_CONFIG.RATE !== 0) {
      alert("Masukkan kelipatan 10 minimal 10.");
      return;
    }
    addActivity(`[swap] Request swap ${val} points`);
    if (!window.DreamWeb3) { alert("Wallet belum terkoneksi."); return; }
    const ok = await DreamWeb3.swapScore(val);
    if (ok) {
      addActivity(`[swap] Swap on-chain success for ${val} points`);
      // reduce local leaderboard accordingly
      reduceLocalScore(val);
    } else {
      addActivity(`[swap] Swap failed or simulated for ${val} points`);
    }
    refreshLeaderboardUI();
  };
}

function reduceLocalScore(points) {
  const lbObj = JSON.parse(localStorage.getItem("leaderboard") || "{}");
  const addr = (DreamWeb3 && DreamWeb3.address) ? DreamWeb3.address : null;
  if (!addr) return;
  if (!lbObj[addr]) return;
  lbObj[addr] = Math.max(0, lbObj[addr] - points);
  localStorage.setItem("leaderboard", JSON.stringify(lbObj));
}

// leaderboard UI
function refreshLeaderboardUI() {
  const lbObj = JSON.parse(localStorage.getItem("leaderboard") || "{}");
  const listEl = document.getElementById("leaderboard-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  const arr = Object.entries(lbObj).map(([wallet, score]) => ({ wallet, score }));
  arr.sort((a,b)=>b.score-a.score);
  arr.slice(0,20).forEach((it,i)=>{
    const li = document.createElement("li");
    li.innerText = `${i+1}. ${it.wallet.slice(0,6)}...: ${it.score}`;
    listEl.appendChild(li);
  });
  const myAddr = (DreamWeb3 && DreamWeb3.address) ? DreamWeb3.address : null;
  if (myAddr) {
    document.getElementById("my-total-score").innerText = (JSON.parse(localStorage.getItem("leaderboard")||"{}")[myAddr]||0);
  }
}

// simple page init
document.addEventListener("DOMContentLoaded", () => {
  refreshLeaderboardUI();
  const toggle = document.getElementById("toggle-sim");
  if (toggle) {
    toggle.onchange = (e) => {
      if (e.target.checked) {
        if (typeof startMockStream === "function") startMockStream();
      } else {
        if (typeof stopMockStream === "function") stopMockStream();
      }
    };
  }
});
