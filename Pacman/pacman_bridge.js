/* pacman_bridge.js — FINAL UNTUK BEDA DOMAIN */

const PARENT_ORIGIN = "*"; 
// Nanti kalau sudah production, bisa diganti ke domain dashboard asli

// ✅ Kirim permintaan start game ke dashboard
function requestStartGame() {
  window.parent.postMessage(
    { type: "REQUEST_START_GAME" },
    PARENT_ORIGIN
  );
}

// ✅ Kirim score untuk diklaim ke dashboard
function requestClaimScore(score) {
  window.parent.postMessage(
    {
      type: "REQUEST_CLAIM_SCORE",
      points: Number(score || 0)
    },
    PARENT_ORIGIN
  );
}

// ✅ Terima balasan dari dashboard (TX result)
window.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "START_GAME_RESULT") {
    if (data.success) {
      window.running = true;
      alert("✅ TX Success! Game Started");
    } else {
      alert("❌ TX Gagal / Ditolak");
    }
  }

  if (data.type === "CLAIM_RESULT") {
    alert("✅ Claim Result: " + JSON.stringify(data.result));
  }
});
