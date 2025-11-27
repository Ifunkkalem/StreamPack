/* app.js — DreamStream v2 FINAL (parent app) */

function refreshLeaderboard() {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  document.getElementById("my-total-score").innerText =
    lb.reduce((sum, x) => sum + (x.score || 0), 0);

  const ul = document.getElementById("leaderboard-list");
  ul.innerHTML = "";
  lb.slice(0, 10).forEach((item, i) => {
    const li = document.createElement("li");
    li.innerText = `${i + 1}. ${item.score}`;
    ul.appendChild(li);
  });
}

document.getElementById("btn-swap").onclick = () => {
  const val = parseInt(document.getElementById("swap-input").value || 0);
  if (isNaN(val) || val < 10 || val % 10 !== 0) {
    document.getElementById("swap-status").innerText = "Minimal 10 dan kelipatan 10.";
    return;
  }
  const pac = val / 10;
  document.getElementById("swap-status").innerText = `Swap simulasi → ${pac} PAC`;
};

document.getElementById("btn-clear").onclick = () => {
  document.getElementById("activity").innerHTML = "";
};

document.getElementById("btn-export").onclick = () => {
  const txt = document.getElementById("activity").innerText;
  const blob = new Blob([txt], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dreamstream-log.txt";
  a.click();
};

refreshLeaderboard();

/* IFRAME COMMUNICATION — menerima event dari iframe (game) */
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  if (data.type === "REQUEST_START_GAME") {
    addActivity("[iframe] request start game");
    const ok = await DreamWeb3.startGame();
    // kirim balik ke iframe hasil
    const iframe = document.getElementById("pacman-iframe");
    iframe && iframe.contentWindow && iframe.contentWindow.postMessage({
      type: "START_GAME_RESULT",
      ok: !!ok
    }, "*");
    addActivity(`[onchain] startGame result: ${ok ? "OK":"FAILED"}`);
  }

  if (data.type === "POINTS_SUBMIT") {
    const pts = Number(data.points || 0);
    if (pts > 0) {
      const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
      lb.unshift({ score: pts, time: Date.now() });
      localStorage.setItem("leaderboard", JSON.stringify(lb.slice(0,200)));
      refreshLeaderboard();
      addActivity(`[iframe] submitted score ${pts}`);
    }
  }
});

function addActivity(msg) {
  const div = document.getElementById("activity");
  const now = new Date().toLocaleTimeString();
  div.innerHTML += `<div>[${now}] ${msg}</div>`;
  div.scrollTop = div.scrollHeight;
}
