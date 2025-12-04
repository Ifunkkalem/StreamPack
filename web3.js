/* ================================
   PACMAN MAINNET WEB3 FINAL
   ================================ */

let provider, signer, userAddress, gameContract;

/* ================= CONNECT WALLET ================= */

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Metamask tidak ditemukan!");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Switch ke SOMNIA MAINNET
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== window.SOMNIA_CHAIN.chainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: window.SOMNIA_CHAIN.chainId }]
      });
    }

    gameContract = new ethers.Contract(
      window.CONTRACTS.LEADERBOARD,
      window.PACMAN_ABI,
      signer
    );

    document.getElementById("addr-display").innerText =
      userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

    document.getElementById("live-indicator").classList.remove("offline");
    document.getElementById("live-indicator").classList.add("online");
    document.getElementById("live-indicator").innerText = "ONLINE";

    updateBalance();
    loadLeaderboard();

    console.log("✅ WALLET CONNECTED:", userAddress);
  } catch (err) {
    console.error("CONNECT ERROR:", err);
    alert("Gagal connect wallet");
  }
}

document.getElementById("btn-connect").onclick = connectWallet;

/* ================= BALANCE ================= */

async function updateBalance() {
  try {
    const bal = await provider.getBalance(userAddress);
    document.getElementById("balance-stt").innerText =
      Number(ethers.utils.formatEther(bal)).toFixed(4);
  } catch (e) {
    console.error("BALANCE ERROR:", e);
  }
}

/* ================= START GAME (0.01 SOMI) ================= */

async function startGameOnChain() {
  try {
    if (!gameContract) throw "Contract belum siap";

    const tx = await gameContract.startGame({
      value: ethers.utils.parseEther(window.GAME_CONFIG.PLAY_FEE_SOMI)
    });

    console.log("START TX:", tx.hash);
    await tx.wait();

    alert("✅ Start Game berhasil!");
    updateBalance();
    return true;
  } catch (err) {
    console.error("🔴 Startgame error:", err);
    alert("❌ Start Game gagal: " + (err.reason || err.message));
    return false;
  }
}

/* ================= SUBMIT SCORE ================= */

async function submitScoreOnChain(score) {
  try {
    if (!gameContract) throw "Contract belum siap";

    const tx = await gameContract.submitScore(score);
    console.log("SCORE TX:", tx.hash);
    await tx.wait();

    alert("✅ Score tersimpan di Blockchain!");
    loadLeaderboard();
  } catch (err) {
    console.error("SUBMIT SCORE ERROR:", err);
    alert("❌ Submit score gagal: " + (err.reason || err.message));
  }
}

/* ================= LOAD TOP 10 ================= */

async function loadLeaderboard() {
  try {
    if (!gameContract) return;

    const data = await gameContract.getTop10();
    const players = data[0];
    const scores = data[1];

    const el = document.getElementById("leaderboard-list");
    el.innerHTML = "";

    for (let i = 0; i < players.length; i++) {
      const li = document.createElement("li");
      li.innerText =
        players[i].slice(0, 6) +
        "..." +
        players[i].slice(-4) +
        " — " +
        scores[i] +
        " pts";
      el.appendChild(li);
    }
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
  }
}

/* ================= GAME IFRAME LISTENER ================= */

window.addEventListener("message", async (ev) => {
  if (!ev.data || !ev.data.type) return;

  // 👉 Dari Pacman iframe
  if (ev.data.type === "REQUEST_START_GAME") {
    const ok = await startGameOnChain();
    window.frames[0].postMessage(
      { type: "START_GAME_RESULT", success: ok },
      "*"
    );
  }

  if (ev.data.type === "SUBMIT_SCORE") {
    await submitScoreOnChain(ev.data.score);
  }
});
