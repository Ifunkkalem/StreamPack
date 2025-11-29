/* app.js — DreamStream (updated) */

/* ========= GLOBAL STATE ========= */
let CURRENT_SCORE = 0;
let WALLET = null;

/* helper: ambil wallet yang valid */
function getWalletAddress() {
  if (WALLET) return WALLET;
  if (window.DreamWeb3 && window.DreamWeb3.address) return window.DreamWeb3.address;
  return null;
}

/* ========= WALLET READY HOOK ========= */
window.afterWalletConnected = function () {
  WALLET = getWalletAddress();
  loadLeaderboard();
  // tampilkan current score jika ada
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const me = lb.find(r => r.wallet && r.wallet.toLowerCase() === (WALLET||"").toLowerCase());
  CURRENT_SCORE = me ? Number(me.score || 0) : 0;
  const ptsEl = document.getElementById("points");
  if (ptsEl) ptsEl.innerText = CURRENT_SCORE;
  addActivity(`[system] Wallet connected: ${WALLET}`);
};

/* ========= UI HELPERS ========= */
function uiStatus(msg) {
  const el = document.getElementById("swap-status");
  if (el) el.innerText = msg;
}

function addActivity(msg) {
  console.log(msg);
  const log = document.getElementById("debug-log") || document.getElementById("activity");
  if (log) {
    const p = document.createElement("div");
    p.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    log.prepend(p);
  }
}

/* ========= LEADERBOARD RENDERING ========= */
function renderLeaderboardFromArray(arr) {
  // try both possible container IDs to be robust
  const containerDiv = document.getElementById("leaderboard");
  const containerList = document.getElementById("leaderboard-list");

  if (containerList && (containerList.tagName === "OL" || containerList.tagName === "UL")) {
    containerList.innerHTML = "";
    arr.slice(0, 100).forEach((r, i) => {
      const li = document.createElement("li");
      const addr = r.wallet || "unknown";
      li.innerText = `${i + 1}. ${addr.slice(0,6)}...${addr.slice(-4)} — ${r.score} pts`;
      containerList.appendChild(li);
    });
  }

  if (containerDiv) {
    containerDiv.innerHTML = "";
    arr.slice(0, 100).forEach((r, i) => {
      const div = document.createElement("div");
      const addr = r.wallet || "unknown";
      div.innerText = `${i + 1}. ${addr.slice(0,6)}...${addr.slice(-4)} — ${r.score} pts`;
      containerDiv.appendChild(div);
    });
  }
}

function loadLeaderboard() {
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  renderLeaderboardFromArray(data);
}

/* ========= SWAP HANDLER ========= */
document.getElementById("btn-swap").onclick = async () => {
  const input = document.getElementById("swap-input");
  const pts = parseInt(input.value || "0", 10);

  if (!pts || pts < 10 || pts % 10 !== 0) {
    uiStatus("Minimal 10 dan kelipatan 10.");
    return;
  }

  const wallet = getWalletAddress();
  if (!wallet) {
    uiStatus("Wallet belum terhubung.");
    return;
  }

  uiStatus("Processing swap...");
  addActivity(`[swap] Requesting swap: ${pts} pts by ${wallet}`);

  try {
    // panggil fungsi requestSwap di web3.js (onsite: melakukan fee tx jika dikonfigurasi)
    const res = await window.DreamWeb3.requestSwap(pts);

    if (!res || !res.success) {
      uiStatus(res && res.message ? res.message : "SWAP gagal atau dibatalkan.");
      addActivity("[swap] Swap gagal atau dibatalkan.");
      return;
    }

    // Update leaderboard: kurangi poin yang dipakai dari wallet yang sama
    let lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    const idx = lb.findIndex(r => r.wallet && r.wallet.toLowerCase() === wallet.toLowerCase());
    if (idx >= 0) {
      lb[idx].score = Number(lb[idx].score || 0) - pts;
      if (lb[idx].score <= 0) {
        lb.splice(idx, 1); // hapus entry jika sisa 0 atau negatif
      }
    } else {
      // jika tidak ditemukan, simpan sebagai record swapped (skenario: klaim lewat iframe tapi belum ada entry)
      // tidak menambah negatif, cuma catat request sudah dibuat
    }

    // simpan dan re-render
    localStorage.setItem("leaderboard", JSON.stringify(lb.slice(0, 200)));
    loadLeaderboard();

    // update CURRENT_SCORE dan UI points
    CURRENT_SCORE = lb.find(r => r.wallet && r.wallet.toLowerCase() === wallet.toLowerCase())?.score || 0;
    const ptsEl = document.getElementById("points");
    if (ptsEl) ptsEl.innerText = CURRENT_SCORE;

    uiStatus(`Swap sukses: ${res.pac} PAC (pending).`);
    addActivity(`[swap] Request sukses → ${res.pac} PAC (id:${res.request?.id || "n/a"})`);

    input.value = "";
  } catch (e) {
    console.error("Swap error:", e);
    uiStatus("Swap gagal, lihat console.");
    addActivity("[swap] Error di proses swap. Cek console.");
  }
};

/* ========= CLAIM SCORE (dari iframe) ========= */
function handleClaimScore(score) {
  const wallet = getWalletAddress();
  if (!wallet) {
    addActivity("[claim] Wallet belum terhubung — klaim dibatalkan.");
    return;
  }

  CURRENT_SCORE = Number(score || 0);

  let leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  // 1 wallet = 1 rank -> hapus entri lama untuk wallet ini
  leaderboard = leaderboard.filter(r => (r.wallet || "").toLowerCase() !== wallet.toLowerCase());

  // tambahkan entri baru
  leaderboard.push({
    wallet: wallet,
    score: CURRENT_SCORE,
    time: Date.now()
  });

  // urutkan dan potong
  leaderboard.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  leaderboard = leaderboard.slice(0, 200);

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  // update UI points & leaderboard
  const ptsEl = document.getElementById("points");
  if (ptsEl) ptsEl.innerText = CURRENT_SCORE;

  loadLeaderboard();

  addActivity(`[claim] ${wallet} +${CURRENT_SCORE} points saved to leaderboard`);
}

/* ========= IFRAME MESSAGING ========= */
window.addEventListener("message", async (ev) => {
  if (!ev.data || !ev.data.type) return;

  if (ev.data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] REQUEST_START_GAME received");

    // pastikan wallet terhubung
    const ok = await (window.DreamWeb3 ? window.DreamWeb3.startGame() : Promise.resolve(false));
    if (ok) {
      // kirim balik ke iframe
      const iframe = document.getElementById("pacman-iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "START_GAME_RESULT", success: true }, window.location.origin);
      }
      addActivity("[onchain] startGame result: success");
    } else {
      const iframe = document.getElementById("pacman-iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "START_GAME_RESULT", success: false }, window.location.origin);
      }
      addActivity("[onchain] startGame result: failed");
    }
  }

  if (ev.data.type === "REQUEST_CLAIM_SCORE") {
    const score = parseInt(ev.data.score || 0, 10);
    addActivity(`[iframe] REQUEST_CLAIM_SCORE ${score}`);
    handleClaimScore(score);
  }
});

/* ========= INITIAL LOAD ========= */
window.onload = () => {
  // set WALLET if already connected
  WALLET = getWalletAddress();
  loadLeaderboard();

  // tampilkan initial points jika ada
  const ptsEl = document.getElementById("points");
  if (ptsEl) {
    const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    const me = WALLET ? lb.find(r => r.wallet && r.wallet.toLowerCase() === WALLET.toLowerCase()) : null;
    ptsEl.innerText = me ? me.score : 0;
    CURRENT_SCORE = me ? me.score : 0;
  }
};
