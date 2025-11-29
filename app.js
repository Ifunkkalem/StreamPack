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

// ✅ FIX PAKSA TOMBOL SWAP AGAR BENAR-BENAR ONCHAIN

document.getElementById("btn-swap")?.addEventListener("click", async () => {
  const input = document.getElementById("swap-input");
  const pts = Number(input.value || 0);

  if (!pts || pts < 10) {
    alert("Masukkan minimal 10 point untuk swap.");
    return;
  }

  addActivity(`[swap] Request swap ${pts} points`);

  try {
    const res = await DreamWeb3.claimScore(pts);
    if (res.success) {
      addActivity(`[swap] ✅ SWAP SUCCESS: ${res.txHash}`);
      alert("SWAP BERHASIL! PAC akan masuk setelah TX confirm.");

      input.value = "";
      refreshLeaderboardUI(); // update UI
    } else {
      addActivity(`[swap] ❌ SWAP FAILED`);
      alert("SWAP GAGAL atau dibatalkan.");
    }
  } catch (err) {
    console.error(err);
    addActivity("[swap] ❌ ERROR: " + err.message);
    alert("ERROR swap: " + err.message);
  }
});
