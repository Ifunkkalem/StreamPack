/* web3.js — DreamStream PRO+ FINAL (patched) */

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

  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan. Buka melalui browser MetaMask.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      document.getElementById("addr-display").innerText = this.address;

      await this.refreshBalances();
      window.IS_CONNECTED = true;

      document.getElementById("live-indicator").classList.remove("offline");
      document.getElementById("live-indicator").classList.add("online");
      document.getElementById("live-indicator").innerText = "ONLINE";

      // enable Start button in parent page (if exists)
      const startBtn = document.getElementById("start-button");
      if (startBtn) startBtn.disabled = false;

      // beri tahu iframe pacman bahwa wallet sudah connected + kirim balances
      notifyPacmanAfterConnect(this);

      // mulai mock stream & pairs hanya setelah connect (jika toggle aktif)
      if (document.getElementById("toggle-sim")?.checked) {
        startMockStream();
      }

      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet.");
      return null;
    }
  },

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

      // update pairs immediately
      if (typeof updatePairs === "function") updatePairs();
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  },

  async startGame() {
    // pastikan signer => processed only when wallet connected
    if (!this.signer) {
      alert("Connect wallet dulu.");
      return false;
    }

    try {
      // gunakan fee kecil (sesuaikan kebutuhan). Anda minta 0.01 STT sebelumnya.
      const valueToSend = "0.01"; // string ether
      const tx = await this.signer.sendTransaction({
        to: this.address, // dummy: kirim ke self (simulasi bayar)
        value: ethers.utils.parseEther(valueToSend)
      });

      await tx.wait();
      // setelah sukses, refresh balance & notify iframe
      await this.refreshBalances();
      // kirim notifikasi ke iframe
      const ifr = document.getElementById("pacman-iframe");
      if (ifr) {
        try {
          ifr.contentWindow.postMessage({ type: "WALLET_TX_SUCCESS", hash: tx.hash }, "*");
        } catch (e) {}
      }
      return true;
    } catch (err) {
      console.error("Start game error:", err);
      alert("Gagal melakukan pembayaran STT. Pastikan saldo cukup dan jaringan Somnia dipilih.");
      return false;
    }
  },

  async swapScore(score) {
    if (score < 10) return "Minimal 10 poin untuk swap.";
    const pac = Math.floor(score / 10);
    return `Berhasil swap → ${pac} PAC (simulasi).`;
  }
};

/* helper: notify iframe setelah connect dengan balance */
async function notifyPacmanAfterConnect(web3obj) {
  try {
    const balSTT = await web3obj.provider.getBalance(web3obj.address);
    const pac = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, web3obj.provider);
    const balPAC = await pac.balanceOf(web3obj.address);

    notifyPacmanIframe({
      type: "WALLET_CONNECTED",
      address: web3obj.address,
      balanceSTT: ethers.utils.formatEther(balSTT),
      balancePAC: ethers.utils.formatUnits(balPAC, 18)
    });
  } catch (e) {
    console.warn("notifyPacmanAfterConnect failed", e);
  }
}

/* connect button parent */
document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
