/* stream_adapter.js — FINAL FIX */

let pointsInterval = null;

function startMockStream() {
  if (!window.IS_CONNECTED) return; // ⛔ Tidak boleh jalan sebelum wallet connect

  let p = 0;

  pointsInterval = setInterval(() => {
    p += Math.floor(Math.random() * 5) + 1;

    document.getElementById("points").innerText = p;
    addActivity(`[stream] +${p} points`);
  }, 2000);
}

function stopMockStream() {
  clearInterval(pointsInterval);
}

function addActivity(msg) {
  const box = document.getElementById("activity");
  const now = new Date().toLocaleTimeString();
  box.innerHTML += `<div>[${now}] ${msg}</div>`;
  box.scrollTop = box.scrollHeight;
}

/* toggle */
document.getElementById("toggle-sim").onchange = (e) => {
  stopMockStream();
  if (e.target.checked && window.IS_CONNECTED) startMockStream();
};

/* 🔥 Jangan mulai otomatis lagi */
/* startMockStream(); → HAPUS */
