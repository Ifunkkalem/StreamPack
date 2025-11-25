/* stream_adapter.js — mock stream for points (patched) */

let pointsInterval = null;
let currentPoints = 0;

function startMockStream() {
  if (pointsInterval) return; // sudah berjalan
  currentPoints = Number(document.getElementById("points")?.innerText || 0);

  pointsInterval = setInterval(() => {
    // tambahkan delta kecil agar log lebih manusiawi
    const delta = Math.floor(Math.random() * 3) + 1; // 1..3
    currentPoints += delta;
    document.getElementById("points").innerText = currentPoints;
    addActivity(`[stream] +${delta} (total ${currentPoints})`);

    // broadcast ke iframe juga (optional)
    notifyPacmanIframe({ type: "STREAM_POINTS", total: currentPoints, delta });

  }, 2000);
}

function stopMockStream() {
  if (pointsInterval) {
    clearInterval(pointsInterval);
    pointsInterval = null;
  }
}

function addActivity(msg) {
  const div = document.getElementById("activity");
  const now = new Date().toLocaleTimeString();
  div.innerHTML += `<div>[${now}] ${msg}</div>`;
  div.scrollTop = div.scrollHeight;
}

/* toggle handler: hanya aktif jika wallet connected */
document.getElementById("toggle-sim").onchange = (e) => {
  const checked = e.target.checked;
  if (!window.IS_CONNECTED && checked) {
    // forbid auto-start before connect
    addActivity("[mock] Toggle on blocked: wallet not connected");
    // force UI off
    e.target.checked = false;
    alert("Hubungkan wallet dulu untuk mengaktifkan mock stream.");
    return;
  }

  if (checked) startMockStream();
  else stopMockStream();
};

/* IMPORTANT: jangan autostart mock ketika file dimuat */
// sebelumnya ada startMockStream() di akhir; dihapus supaya mock tidak langsung jalan.
