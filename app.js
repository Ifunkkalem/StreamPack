/* app.js — DreamStream v2 FINAL (patched) */

let myScore = 0;

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
    document.getElementById("swap-status").innerText =
      "Minimal 10 dan kelipatan 10.";
    return;
  }

  const pac = val / 10;
  document.getElementById("swap-status").innerText =
    `Swap berhasil → ${pac} PAC (simulasi)`;
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

/* -------------------------
   IFRAME COMMUNICATION
   ------------------------- */

// kirim pesan ke iframe pacman (jika ada)
function notifyPacmanIframe(payload) {
  const iframe = document.getElementById("pacman-iframe");
  if (!iframe) return;
  try {
    iframe.contentWindow.postMessage(payload, "*");
  } catch (e) {
    console.warn("Failed to postMessage to iframe:", e);
  }
}

// terima pesan dari iframe
window.addEventListener("message", async (ev) => {
  const data = ev.data || {};
  if (!data.type) return;

  // iframe meminta memulai game (user menekan Start di iframe)
  if (data.type === "REQUEST_START_GAME") {
    // panggil fungsi on parent untuk start (web3)
    addActivity("[iframe] Request start game");
    const ok = await DreamWeb3.startGame(); // akan men-trigger transaksi
    notifyPacmanIframe({ type: "START_GAME_RESULT", success: !!ok });
    if (ok) addActivity("[onchain] Start game TX success");
    else addActivity("[onchain] Start game TX failed");
  }

  // iframe memberi tahu point event (mis. player mendapatkan point) -> simpan local leaderboard
  if (data.type === "SOMNIA_POINT_EVENT") {
    const pts = Number(data.points || 0);
    if (pts > 0) {
      const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
      lb.unshift({ score: pts, time: Date.now() });
      localStorage.setItem("leaderboard", JSON.stringify(lb.slice(0, 200)));
      refreshLeaderboard();
      addActivity(`[iframe] Point event +${pts}`);
    }
  }
});

/* helper activity logger */
function addActivity(msg) {
  const div = document.getElementById("activity");
  const now = new Date().toLocaleTimeString();
  div.innerHTML += `<div>[${now}] ${msg}</div>`;
  div.scrollTop = div.scrollHeight;
}
