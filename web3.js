/* web3.js — FINAL (Somnia, on-chain start & claim) */

async function waitForEthereum() {
  return new Promise(resolve => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const t = setInterval(() => {
      if (window.ethereum || tries > 30) {
        clearInterval(t);
        resolve(window.ethereum);
      }
      tries++;
    }, 150);
  });
}

async function ensureSomniaChain() {
  try {
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [window.SOMNIA_CHAIN] });
    return true;
  } catch (e) {
    console.error("ensureSomniaChain error:", e);
    return false;
  }
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,
  rewardContract: null,

  async connect() {
    await waitForEthereum();
    if (!window.ethereum) {
      alert("MetaMask tidak terdeteksi. Buka lewat browser MetaMask.");
      return null;
    }

    const ok = await ensureSomniaChain();
    if (!ok) {
      alert("Gagal menambahkan jaringan Somnia ke MetaMask.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      document.getElementById("addr-display").innerText = this.address;

      // siapkan instance contract reward (read/write via signer when needed)
      this.rewardContract = new ethers.Contract(window.CONTRACTS.REWARD_CONTRACT, window.ABI.REWARD, this.signer);

      await this.refreshBalances();

      // set connected flag & UI
      window.IS_CONNECTED = true;
      const ind = document.getElementById("live-indicator");
      if (ind) {
        ind.classList.remove("offline");
        ind.classList.add("online");
        ind.innerText = "ONLINE";
      }

      // trigger parent-level activation (mock stream) only setelah connect
      if (window.afterWalletConnected) window.afterWalletConnected();

      return this.address;
    } catch (err) {
      console.error("connect error:", err);
      alert("Gagal menghubungkan wallet.");
      return null;
    }
  },

  async refreshBalances() {
    if (!this.provider || !this.address) return;
    try {
      const sttBal = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText = Number(ethers.utils.formatEther(sttBal)).toFixed(4);

      const pac = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.provider);
      const balPAC = await pac.balanceOf(this.address);
      // decimals 18 assumed
      document.getElementById("balance-pac").innerText = Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(4);
    } catch (e) {
      console.error("refreshBalances error:", e);
    }
  },

  // startGame -> call reward.startGame() payable with startFee on contract
  async startGame() {
    if (!this.signer || !this.rewardContract) {
      alert("Connect wallet terlebih dahulu.");
      return false;
    }
    try {
      // baca startFee dari kontrak (fallback 0.01 jika belum available)
      let startFee = ethers.utils.parseEther("0.01");
      try {
        const f = await this.rewardContract.startFee();
        if (f) startFee = f;
      } catch (_) {}

      const tx = await this.rewardContract.startGame({ value: startFee });
      addActivity("[onchain] startGame tx sent: " + tx.hash);
      await tx.wait();
      await this.refreshBalances();
      addActivity("[onchain] startGame mined: " + tx.hash);
      return true;
    } catch (err) {
      console.error("startGame tx error:", err);
      alert("Transaksi startGame gagal atau dibatalkan.");
      return false;
    }
  },

  // claimScore -> call reward.submitScore(points) payable with claimFee
  async claimScore(points) {
    if (!this.signer || !this.rewardContract) {
      alert("Connect wallet terlebih dahulu.");
      return { success: false, err: "no_connect" };
    }
    if (!points || points <= 0) {
      return { success: false, err: "invalid_points" };
    }
    try {
      let claimFee = ethers.utils.parseEther("0.001");
      try {
        const f = await this.rewardContract.claimFee();
        if (f) claimFee = f;
      } catch (_) {}

      const tx = await this.rewardContract.submitScore(points, { value: claimFee });
      addActivity("[onchain] submitScore tx sent: " + tx.hash);
      await tx.wait();
      await this.refreshBalances();
      addActivity("[onchain] submitScore mined: " + tx.hash);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error("claimScore tx error:", err);
      return { success: false, err };
    }
  }
};

// connect button hookup (parent will call DreamWeb3.connect)
const btn = document.getElementById("btn-connect");
if (btn) btn.onclick = async () => { await DreamWeb3.connect(); };
