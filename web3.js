/* web3.js — FINAL (connect, balances, startGame, swapScore, disconnect) */

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const i = setInterval(() => {
      if (window.ethereum || tries > 40) {
        clearInterval(i);
        resolve(window.ethereum);
      }
      tries++;
    }, 150);
  });
}

async function ensureSomniaChain() {
  if (!window.ethereum || !window.SOMNIA_CHAIN) return false;
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [window.SOMNIA_CHAIN]
    });
    return true;
  } catch (err) {
    console.warn("ensureSomniaChain:", err);
    return false;
  }
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,
  connected: false,

  async connect() {
    await waitForEthereum();
    if (!window.ethereum) {
      alert("MetaMask / Provider tidak ditemukan. Buka lewat browser MetaMask atau pasang ekstensi.");
      return null;
    }

    // pastikan chain Somnia tersedia (akan tampil permintaan di MetaMask)
    await ensureSomniaChain();

    try {
      // jika ethers belum ada (pastikan libs/ethers.min.js di-upload)
      if (!window.ethers) {
        console.error("ethers.js tidak ditemukan. Pastikan libs/ethers.min.js tersedia.");
        alert("Library ethers tidak ditemukan. Upload libs/ethers.min.js lalu refresh.");
        return null;
      }

      this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");

      // listen account/chain changes
      window.ethereum.on && window.ethereum.on("accountsChanged", (accs) => {
        if (!accs || accs.length === 0) {
          this.disconnectUI();
        } else {
          this.address = accs[0];
          document.getElementById("addr-display").innerText = this.address;
          this.refreshBalances().catch(console.error);
        }
      });

      window.ethereum.on && window.ethereum.on("chainChanged", (chainId) => {
        // refresh balances/UI on chain change
        setTimeout(() => this.refreshBalances().catch(console.error), 300);
      });

      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      document.getElementById("addr-display").innerText = this.address;
      this.connected = true;

      // UI: indicator
      const ind = document.getElementById("live-indicator");
      ind && ind.classList && ind.classList.replace("offline", "online");
      ind && (ind.innerText = "ONLINE");

      // enable start-button if exists (iframe start handled via postMessage)
      const startBtn = document.getElementById("start-button");
      if (startBtn) startBtn.disabled = false;

      await this.refreshBalances();

      // jika toggle mock sudah dicentang -> start mock now
      const toggle = document.getElementById("toggle-sim");
      if (toggle && toggle.checked && window.startMockStream) {
        window.startMockStream();
      }

      return this.address;
    } catch (err) {
      console.error("connect error:", err);
      alert("Gagal menghubungkan wallet. Periksa MetaMask & RPC Somnia.");
      return null;
    }
  },

  async refreshBalances() {
    if (!this.provider || !this.address) return;
    try {
      const stt = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(stt)).toFixed(4);

      // get PAC token balance if configured
      if (window.CONTRACTS && window.CONTRACTS.PAC_TOKEN && window.ABI && window.ABI.PAC) {
        const pac = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.provider);
        const balPAC = await pac.balanceOf(this.address);
        document.getElementById("balance-pac").innerText =
          Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(2);
      } else {
        document.getElementById("balance-pac").innerText = "-";
      }
    } catch (err) {
      console.error("refreshBalances error:", err);
      document.getElementById("balance-stt") && (document.getElementById("balance-stt").innerText = "-");
      document.getElementById("balance-pac") && (document.getElementById("balance-pac").innerText = "-");
    }
  },

  async startGame() {
    if (!this.signer) {
      alert("Silakan connect wallet dulu.");
      return false;
    }

    try {
      // cek balance STT dulu
      const bal = await this.provider.getBalance(this.address);
      if (ethers.BigNumber.from(bal).lt(ethers.utils.parseEther("0.01"))) {
        alert("Saldo STT kurang (butuh minimal 0.01 STT untuk start game).");
        return false;
      }

      // lakukan dummy tx ke diri sendiri sebagai fee
      const tx = await this.signer.sendTransaction({
        to: this.address,
        value: ethers.utils.parseEther("0.01")
      });
      await tx.wait();

      // refresh balances & UI
      await this.refreshBalances();

      return true;
    } catch (err) {
      console.error("startGame tx error:", err);
      alert("Transaksi start game gagal atau dibatalkan.");
      return false;
    }
  },

  async swapScore(score) {
    if (score < 10) return "Minimal 10 poin untuk swap.";
    const pacAmount = Math.floor(score / 10);
    // saat ini hanya simulasi — implementasi onchain bisa ditambahkan
    return `Swap simulasi berhasil → ${pacAmount} PAC`;
  },

  disconnectUI() {
    this.connected = false;
    this.address = null;
    document.getElementById("addr-display") && (document.getElementById("addr-display").innerText = "Not connected");
    document.getElementById("balance-stt") && (document.getElementById("balance-stt").innerText = "-");
    document.getElementById("balance-pac") && (document.getElementById("balance-pac").innerText = "-");
    const ind = document.getElementById("live-indicator");
    ind && ind.classList && ind.classList.replace("online", "offline");
    ind && (ind.innerText = "OFFLINE");
    if (window.stopMockStream) window.stopMockStream();
    const startBtn = document.getElementById("start-button");
    if (startBtn) startBtn.disabled = true;
  }
};

// bind connect button
document.getElementById("btn-connect") && (document.getElementById("btn-connect").onclick = async () => {
  await window.DreamWeb3.connect();
});
