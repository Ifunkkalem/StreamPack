let DISPLAY_NAME = "";
let WALLET = null;

window.addEventListener("load", () => {
  console.log("[APP] Loaded");

  const mainMenu = document.getElementById("main-menu");
  const gameWrapper = document.getElementById("game-wrapper");
  const lbPanel = document.getElementById("leaderboard-panel");

  const btnPlay = document.getElementById("btn-play");
  const btnLB = document.getElementById("btn-leaderboard");
  const btnQuit = document.getElementById("btn-quit");

  const nameInput = document.getElementById("display-name");
  const walletInfo = document.getElementById("wallet-info");

  // ✅ DEBUG: pastikan tombol benar-benar ketemu
  console.log("btnPlay:", btnPlay);

  /* ===== PLAY ===== */
  btnPlay.addEventListener("click", async () => {
    console.log("[CLICK] PLAY");

    DISPLAY_NAME = nameInput.value.trim();

    if (!DISPLAY_NAME) {
      alert("Isi Display Name dulu!");
      return;
    }

    if (!window.DreamWeb3 || !DreamWeb3.address) {
      await DreamWeb3.connect();
    }

    WALLET = DreamWeb3.address;

    walletInfo.innerText =
      "Wallet: " + WALLET.slice(0, 6) + "..." + WALLET.slice(-4);

    const ok = await DreamWeb3.startGame();
    if (!ok) return;

    mainMenu.style.display = "none";
    gameWrapper.style.display = "block";
  });

  /* ===== LEADERBOARD ===== */
  btnLB.addEventListener("click", async () => {
    mainMenu.style.display = "none";
    lbPanel.style.display = "block";
  });

  /* ===== QUIT ===== */
  btnQuit.addEventListener("click", () => {
    window.close();
    window.location.href = "about:blank";
  });

  /* ===== BACK FROM GAME ===== */
  window.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "BACK_TO_MENU") {
      gameWrapper.style.display = "none";
      lbPanel.style.display = "none";
      mainMenu.style.display = "flex";
    }
  });
});
