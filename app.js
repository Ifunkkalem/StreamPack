/* app.js — parent helpers */
function addActivity(msg) {
  const el = document.getElementById("activity");
  if (!el) return;
  const now = new Date().toLocaleTimeString();
  el.innerHTML += `<div>[${now}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

window.afterWalletConnected = function() {
  addActivity(`[system] Wallet connected`);
  // refresh leaderboard and balances handled in web3.js
};

// receive messages from web3.js or iframe already handled in web3.js; app.js only logs
window.addEventListener("message", (ev) => {
  const d = ev.data || {};
  if (!d.type) return;
  if (d.type === "START_GAME_RESULT") {
    addActivity(`[onchain] start game result: ${d.success}`);
  }
  if (d.type === "SUBMIT_RESULT") {
    addActivity(`[onchain] submit score result: ${d.success}`);
  }
});
