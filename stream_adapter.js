/* stream_adapter.js — mock stream for points (won't run until wallet connected) */

let pointsInterval = null;
let currentPoints = 0;

function addActivity(msg) {
  const div = document.getElementById("activity");
  const now = new Date().toLocaleTimeString();
  div.innerHTML += `<div>[${now}] ${msg}</div>`;
  div.scrollTop = div.scrollHeight;
}

function startMockStream() {
  if (pointsInterval) return;
  addActivity("[mock] Mock stream started");
  pointsInterval = setInterval(() => {
    const inc = Math.floor(Math.random() * 5) + 1;
    currentPoints += inc;
    document.getElementById("points").innerText = currentPoints;
    addActivity(`[stream] +${inc} points (total ${currentPoints})`);
    // broadcast to parent window (if iframe host wants it)
    window.parent && window.parent.postMessage && window.parent.postMessage({
      type: "SOMNIA_POINT_EVENT",
      points: inc
    }, "*");
  }, 2000);
}

function stopMockStream() {
  if (!pointsInterval) return;
  clearInterval(pointsInterval);
  pointsInterval = null;
  addActivity("[mock] Mock stream stopped");
}

// Toggle control in UI : only allow start if connected
document.getElementById("toggle-sim").onchange = (e) => {
  if (!window.IS_CONNECTED) {
    e.target.checked = false;
    addActivity("[warn] Connect wallet dulu untuk gunakan Mock Stream.");
    return;
  }
  if (e.target.checked) startMockStream();
  else stopMockStream();
};

// If page loads and connected already, do not auto-start.
// The connect flow will start mock stream after wallet connect if checkbox enabled.
