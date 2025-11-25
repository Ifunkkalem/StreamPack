/* stream_adapter.js — FIX FINAL */

let mockInterval = null;
let isStreaming = false;

function startMockStream() {
  if (isStreaming) return;
  isStreaming = true;

  let p = 0;

  mockInterval = setInterval(() => {
    p += Math.floor(Math.random() * 5) + 1;
    document.getElementById("points").innerText = p;

    addActivity(`[mock] +${p} points`);
  }, 2000);
}

function stopMockStream() {
  clearInterval(mockInterval);
  isStreaming = false;
}

function addActivity(msg) {
  const feed = document.getElementById("activity");
  const t = new Date().toLocaleTimeString();
  feed.innerHTML += `<div>[${t}] ${msg}</div>`;
  feed.scrollTop = feed.scrollHeight;
}

document.getElementById("toggle-sim").onchange = (e) => {
  if (!window.IS_CONNECTED) {
    alert("Connect wallet dulu.");
    e.target.checked = false;
    return;
  }
  if (e.target.checked) startMockStream();
  else stopMockStream();
};
