/* web3.js — FINAL (no swap) */
let provider, signer, userAddress, gameContract;

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const t = setInterval(() => {
      if (window.ethereum || tries > 25) {
        clearInterval(t);
        resolve(window.ethereum);
      }
      tries++;
    }, 150);
  });
}

async function ensureChain() {
  try {
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current === window.SOMNIA_CHAIN.chainId) return true;
    // try switch
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: window.SOMNIA_CHAIN.chainId }]
    });
    return true;
  } catch (err) {
    // try add
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [window.SOMNIA_CHAIN]
      });
      return true;
    } catch (e) {
      console.error("Chain switch/add error:", e);
      return false;
    }
  }
}

async function connectWallet() {
  await waitForEthereum();
  if (!window.ethereum) {
    alert("MetaMask tidak ditemukan. Buka lewat browser MetaMask.");
    return null;
  }

  const ok = await ensureChain();
  if (!ok) {
    alert("Gagal switch/add Somnia chain di wallet.");
    return null;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    gameContract = new ethers.Contract(window.CONTRACTS.LEADERBOARD, window.PACMAN_ABI, signer);

    document.getElementById("addr-display").innerText = userAddress.slice(0,6) + "..." + userAddress.slice(-4);
    const ind = document.getElementById("live-indicator");
    ind.classList.remove("offline"); ind.classList.add("online"); ind.innerText = "ONLINE";

    await refreshBalances();
    await loadLeaderboard();

    // notify host page (app.js) that wallet connected
    if (typeof window.afterWalletConnected === "function") window.afterWalletConnected();

    // listen changes
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", async () => {
        await onAccountsChanged();
      });
      window.ethereum.on("chainChanged", async () => {
        await refreshBalances();
        await loadLeaderboard();
      });
    }

    console.log("Connected:", userAddress);
    return userAddress;
  } catch (err) {
    console.error("connectWallet error:", err);
    alert("Gagal menghubungkan wallet.");
    return null;
  }
}

async function onAccountsChanged() {
  try {
    const accs = await provider.send("eth_accounts", []);
    if (!accs || accs.length === 0) {
      userAddress = null;
      document.getElementById("addr-display").innerText = "Not connected";
      const ind = document.getElementById("live-indicator");
      ind.classList.remove("online"); ind.classList.add("offline"); ind.innerText = "OFFLINE";
    } else {
      userAddress = accs[0];
      document.getElementById("addr-display").innerText = userAddress.slice(0,6) + "..." + userAddress.slice(-4);
      await refreshBalances();
    }
  } catch (e) { console.error(e); }
}

async function refreshBalances() {
  try {
    if (!provider || !userAddress) return;
    const bal = await provider.getBalance(userAddress);
    document.getElementById("balance-stt").innerText = Number(ethers.utils.formatEther(bal)).toFixed(4);
  } catch (e) {
    console.error("refreshBalances:", e);
  }
}

async function startGameOnChain() {
  if (!signer || !gameContract) {
    alert("Wallet belum terhubung.");
    return false;
  }
  try {
    // call contract startGame with value
    const tx = await gameContract.startGame({ value: ethers.utils.parseEther(window.GAME_CONFIG.PLAY_FEE_SOMI) });
    console.log("startGame tx:", tx.hash);
    await tx.wait(1);
    await refreshBalances();
    return true;
  } catch (err) {
    console.error("startGame error:", err);
    return false;
  }
}

async function submitScoreOnChain(score) {
  if (!signer || !gameContract) {
    alert("Wallet belum terhubung.");
    return false;
  }
  try {
    // ensure score <= max
    if (Number(score) > Number(window.GAME_CONFIG.MAX_SCORE_PER_SUBMIT)) {
      alert("Score melebihi limit per submit.");
      return false;
    }
    const tx = await gameContract.submitScore(score);
    console.log("submitScore tx:", tx.hash);
    await tx.wait(1);
    await loadLeaderboard();
    return true;
  } catch (err) {
    console.error("submitScore error:", err);
    return false;
  }
}

async function loadLeaderboard() {
  try {
    if (!gameContract) return;
    const data = await gameContract.getTop10();
    const players = data[0];
    const scores = data[1];
    const el = document.getElementById("leaderboard-list");
    el.innerHTML = "";
    for (let i=0;i<players.length;i++){
      const li = document.createElement("li");
      li.innerText = `${i+1}. ${players[i].slice(0,6)}...${players[i].slice(-4)} — ${scores[i]} pts`;
      el.appendChild(li);
    }
  } catch (err) {
    console.error("loadLeaderboard error:", err);
  }
}

/* bind connect */
document.getElementById("btn-connect").onclick = connectWallet;

/* listen messages from iframe */
window.addEventListener("message", async (ev) => {
  const d = ev.data || {};
  if (!d.type) return;
  if (d.type === "REQUEST_START_GAME") {
    const ok = await startGameOnChain();
    // reply to iframe
    const ifr = document.getElementById("pacman-iframe");
    if (ifr && ifr.contentWindow) {
      ifr.contentWindow.postMessage({ type: "START_GAME_RESULT", success: ok }, "*");
    }
  }
  if (d.type === "SUBMIT_SCORE") {
    const ok = await submitScoreOnChain(d.score);
    // reply
    const ifr = document.getElementById("pacman-iframe");
    if (ifr && ifr.contentWindow) {
      ifr.contentWindow.postMessage({ type: "SUBMIT_RESULT", success: ok }, "*");
    }
  }
});
