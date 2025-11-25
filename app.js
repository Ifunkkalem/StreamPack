/* app.js — DreamStream v2 FINAL */

let myScore = 0;

function refreshLeaderboard() {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  document.getElementById("my-total-score").innerText =
    lb.reduce((sum, x) => sum + x.score, 0);

  const ul = document.getElementById("leaderboard-list");
  ul.innerHTML = "";

  lb.slice(0, 10).forEach((item, i) => {
    const li = document.createElement("li");
    li.innerText = `${i + 1}. ${item.score}`;
    ul.appendChild(li);
  });
}

document.getElementById("btn-swap").onclick = () => {
  const val = parseInt(document.getElementById("swap-input").value);
  if (val < 10 || val % 10 !== 0) {
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
