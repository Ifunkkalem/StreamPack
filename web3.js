/* web3.js — FINAL STABLE BUILD */

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let t = 0;
    const iv = setInterval(() => {
      if (window.ethereum || t > 20) {
        clearInterval(iv);
        resolve(window.ethereum);
      }
      t++;
    }, 150);
  });
}

async function ensureSomniaChain() {
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [window.SOMNIA_CHAIN]
    });
    return true;
  } catch (err) {
    console.error("Add chain error:", err);
    return false;
  }
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,

  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan.");
      return;
    }

    const ok = await ensureSomniaChain();
    if (!ok) return alert("Gagal menambahkan jaringan Somnia.");

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      document.getElementById("addr-display").innerText = this.address;

      await this.refreshBalances();

      window.IS_CONNECTED = true;

      const ind = document.getElementById("live-indicator");
      ind.classList.remove("offline");
      ind.classList.add("online");
      ind.innerText = "ONLINE";

      if (window.afterWalletConnected) window.afterWalletConnected();

      return this.address;

    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet.");
    }
  },

  async refreshBalances() {
    if (!this.provider || !this.address) return;

    try {
      const stt = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(stt)).toFixed(4);

      const pac = new ethers.Contract(
        window.CONTRACTS.PAC_TOKEN,
        window.ABI.PAC,
        this.provider
      );

      const balPAC = await pac.balanceOf(this.address);
      document.getElementById("balance-pac").innerText =
        Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(2);

    } catch (err) {
      console.error("Balance error:", err);
    }
  },

  /* ✅ START GAME – BAYAR 0.01 STT */
  async startGame() {
    if (!this.signer) return false;

    try {
      const tx = await this.signer.sendTransaction({
        to: this.address,
        value: ethers.utils.parseEther("0.01")
      });

      await tx.wait();
      return true;

    } catch (err) {
      console.error("startGame error:", err);
      return false;
    }
  },

  /* ✅ SWAP POINT → PAC (TX ONCHAIN + BAYAR STT) */
  async claimScore(points) {
    if (!this.signer) return { success: false };

    try {
      const reward = new ethers.Contract(
        window.CONTRACTS.REWARD,
        window.ABI.REWARD,
        this.signer
      );

      const tx = await reward.submitScore(points, {
        value: ethers.utils.parseEther("0.001")
      });

      const receipt = await tx.wait();

      await this.refreshBalances();

      return { success: true, txHash: receipt.transactionHash };

    } catch (err) {
      console.error("claimScore error:", err);
      return { success: false, error: err.message };
    }
  }
};

document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
