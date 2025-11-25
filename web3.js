/* web3.js — DreamStream PRO+ FINAL FIXED */

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const intv = setInterval(() => {
      if (window.ethereum || tries > 25) {
        clearInterval(intv);
        resolve(window.ethereum);
      }
      tries++;
    }, 150);
  });
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,

  /* ===========================
     CONNECT WALLET
     =========================== */
  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan. Buka melalui browser MetaMask.");
      return;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // PAS dengan HTML-mu
      document.getElementById("addr-display").innerText = this.address;

      await this.refreshBalances();
      window.IS_CONNECTED = true;

      document.getElementById("live-indicator").classList.remove("offline");
      document.getElementById("live-indicator").classList.add("online");
      document.getElementById("live-indicator").innerText = "ONLINE";

      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet.");
      return null;
    }
  },

  /* ===========================
     REFRESH BALANCE
     =========================== */
  async refreshBalances() {
    if (!this.provider || !this.address) return;

    try {
      // STT native balance
      const balSTT = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(balSTT)).toFixed(4);

      // PAC ERC-20
      const pac = new ethers.Contract(
        window.CONTRACTS.PAC_TOKEN,
        window.ABI.PAC,
        this.provider
      );

      const balPAC = await pac.balanceOf(this.address);
      document.getElementById("balance-pac").innerText =
        Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(2);

    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  },

  /* ===========================
     START GAME (bayar STT)
     =========================== */
  async startGame() {
    if (!this.signer) {
      alert("Connect wallet dulu.");
      return false;
    }

    try {
      // STT native fee
      const tx = await this.signer.sendTransaction({
        to: this.address, // self dummy tx
        value: ethers.utils.parseEther("0.01")
      });

      await tx.wait();
      return true;
    } catch (err) {
      console.error("Start game error:", err);
      alert("Gagal melakukan pembayaran STT.");
      return false;
    }
  },

  /* ===========================
     SWAP SCORE → PAC
     =========================== */
  async swapScore(score) {
    if (score < 10) return "Minimal 10 poin untuk swap.";

    const pac = Math.floor(score / 10);
    return `Berhasil swap → ${pac} PAC (simulasi).`;
  }
};

/* EVENT LISTENER */
document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
