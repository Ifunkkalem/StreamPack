let DISPLAY_NAME = "";
let WALLET = null;

/* ===== UI ELEMENTS ===== */
const mainMenu = document.getElementById("main-menu");
const gameWrapper = document.getElementById("game-wrapper");
const lbPanel = document.getElementById("leaderboard-panel");
const lbList = document.getElementById("leaderboard-list");

const btnPlay = document.getElementById("btn-play");
const btnLB = document.getElementById("btn-leaderboard");
const btnQuit = document.getElementById("btn-quit");

const nameInput = document.getElementById("display-name");
const walletInfo = document.getElementById("wallet-info");

/* ===== PLAY GAME ===== */
btnPlay.onclick = async () => {
  DISPLAY_NAME = nameInput.value.trim();
  if (!DISPLAY_NAME) {
    alert("Isi Display Name dulu!");
    return;
  }

  if (!window.DreamWeb3 || !DreamWeb3.address) {
    await DreamWeb3.connect();
  }

  WALLET = DreamWeb3.address;
  walletInfo.innerText = "Wallet: " + WALLET.slice(0, 6) + "..." + WALLET.slice(-4);

  const ok = await DreamWeb3.startGame();
  if (!ok) return;

  mainMenu.style.display = "none";
  gameWrapper.style.display = "block";
};

/* ===== LEADERBOARD ===== */
btnLB.onclick = async () => {
  mainMenu.style.display = "none";
  lbPanel.style.display = "block";
  await loadLeaderboard();
};

/* ===== QUIT ===== */
btnQuit.onclick = () => {
  window.close();
  window.location.href = "about:blank";
};

/* ===== BACK TO MENU ===== */
function backToMenu() {
  gameWrapper.style.display = "none";
  lbPanel.style.display = "none";
  mainMenu.style.display = "flex";
}

/* ===== RECEIVE BACK FROM PACMAN IFRAME ===== */
window.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "BACK_TO_MENU") {
    backToMenu();
  }

  if (event.data.type === "SUBMIT_SCORE") {
    submitScoreOnchain(event.data.score);
  }
});

/* ===== SUBMIT SCORE ONCHAIN ===== */
async function submitScoreOnchain(score) {
  try {
    await DreamWeb3.submitScore(score);
    await loadLeaderboard();
  } catch (e) {
    console.error("Submit score failed:", e);
  }
}

/* ===== LOAD LEADERBOARD ONCHAIN ===== */
async function loadLeaderboard() {
  lbList.innerHTML = "Loading...";

  try {
    const data = await DreamWeb3.getTop10();
    lbList.innerHTML = "";

    data.players.forEach((addr, i) => {
      const div = document.createElement("div");
      div.className = "lb-item";
      div.innerHTML = `#${i + 1} — ${addr.slice(0, 6)}...${addr.slice(-4)} → ${data.scores[i]} pts`;
      lbList.appendChild(div);
    });
  } catch (e) {
    console.error("Load leaderboard error:", e);
    lbList.innerHTML = "Failed load leaderboard";
  }
      }
