/* pacman_claim.js — FINAL CLAIM BRIDGE */

function claimScoreToDashboard() {
  if (!window.running) {
    alert("❌ Game belum dimulai!");
    return;
  }

  const scoreEl = document.getElementById("score");
  const currentScore = Number(scoreEl?.innerText || 0);

  if (currentScore <= 0) {
    alert("❌ Score masih 0");
    return;
  }

  // Kirim ke dashboard via bridge
  if (typeof requestClaimScore === "function") {
    requestClaimScore(currentScore);
  } else {
    alert("❌ Bridge belum aktif!");
  }
}
