/* stream_adapter.js — mock stream for points */

let pointsInterval = null;

function startMockStream() {
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
  const div = document.getElementById("activity");
  const now = new Date().toLocaleTimeString();
  div.innerHTML += `<div>[${now}] ${msg}</div>`;
  div.scrollTop = div.scrollHeight;
}

document.getElementById("toggle-sim").onchange = (e) => {
  if (e.target.checked) startMockStream();
  else stopMockStream();
};

startMockStream();
