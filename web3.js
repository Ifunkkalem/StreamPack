/* web3.js — DreamStream PRO+ FINAL FIX */

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

/* 🔥 Tambahan: pastikan jaringan Somnia ada di MetaMask */
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

  /* ===========================
     CONNECT WALLET
     =========================== */
  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan.");
      return null;
    }

    /* 🔥 WAJIB: tambahkan Somnia Testnet dulu */
    const ok = await ensureSomniaChain();
    if (!ok) {
      alert("Tidak dapat menambahkan jaringan Somnia.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);

      /* 🔥 Connect akun */
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      document.getElementById("addr-display").innerText = this.address;

      await this.refreshBalances();

      window.IS_CONNECTED = true;

      document.getElementById("live-indicator").classList.remove("offline");
      document.getElementById("live-indicator").classList.add("online");
      document.getElementById("live-indicator").innerText = "ONLINE";

      /* 🔥 Setelah connect → baru aktifkan mock stream */
      if (document.getElementById("toggle-sim").checked) {
        startMockStream();
      }

      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet.");
      return null;
    }
  },

  /* ===========================
     BALANCE
     =========================== */
  async refreshBalances() {
    if (!this.provider || !this.address) return;

    try {
      const balSTT = await this.provider.getBalance(this.address);

      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(balSTT)).toFixed(4);

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
     START GAME (STT fee)
     =========================== */
  async startGame() {
    if (!this.signer) {
      alert("Connect wallet dulu.");
      return false;
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: this.address,
        value: ethers.utils.parseEther("0.01")
      });

      await tx.wait();
      return true;
    } catch (err) {
      console.error("Start game error:", err);
      alert("Pembayaran STT gagal.");
      return false;
    }
  },

  /* ===========================
     SWAP SCORE → PAC
     =========================== */
  async swapScore(score) {
    if (score < 10) return "Minimal 10 poin untuk swap.";
    const pac = Math.floor(score / 10);
    return `Swap berhasil: ${pac} PAC (simulasi).`;
  }
};

/* CONNECT EVENT */
document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
