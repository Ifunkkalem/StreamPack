/* web3.js — FINAL (mobile-safe + swap attempt on-chain + fallback) */

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const i = setInterval(() => {
      if (window.ethereum || tries > 25) {
        clearInterval(i);
        resolve(window.ethereum);
      }
      tries++;
    }, 150);
  });
}

async function ensureSomniaChain() {
  try {
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current === window.SOMNIA_CHAIN.chainId) return true;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: window.SOMNIA_CHAIN.chainId }]
      });
      return true;
    } catch (switchErr) {
      if (switchErr && switchErr.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [window.SOMNIA_CHAIN]
        });
        return true;
      }
      console.error("wallet_switchEthereumChain failed:", switchErr);
      return false;
    }
  } catch (err) {
    console.error("ensureSomniaChain error:", err);
    return false;
  }
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,
  pacContract: null,

  async connect() {
    await waitForEthereum();
    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan. Buka lewat browser MetaMask.");
      return null;
    }

    const okChain = await ensureSomniaChain();
    if (!okChain) {
      alert("Gagal menambahkan / mengalihkan ke jaringan Somnia Testnet.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      // listeners
      if (window.ethereum.on) {
        window.ethereum.on("accountsChanged", async () => { await this._onAccountsChanged(); });
        window.ethereum.on("chainChanged", async () => { await this._onChainChanged(); });
      }

      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // instantiate PAC contract with signer (for txs)
      this.pacContract = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.signer);

      document.getElementById("addr-display").innerText = this.address;
      if (document.getElementById("wallet-address")) document.getElementById("wallet-address").innerText = this.address;

      await this.refreshBalances();

      window.IS_CONNECTED = true;
      const ind = document.getElementById("live-indicator");
      if (ind) { ind.classList.remove("offline"); ind.classList.add("online"); ind.innerText = "ONLINE"; }

      // enable mock stream only after connect (parent app may call afterWalletConnected)
      if (typeof window.afterWalletConnected === "function") window.afterWalletConnected();

      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet atau mengambil alamat. Cek console.");
      return null;
    }
  },

  async _onAccountsChanged() {
    try {
      const accounts = await this.provider.send("eth_accounts", []);
      if (!accounts || accounts.length === 0) {
        window.IS_CONNECTED = false;
        if (document.getElementById("addr-display")) document.getElementById("addr-display").innerText = "Not connected";
        const ind = document.getElementById("live-indicator");
        if (ind) { ind.classList.remove("online"); ind.classList.add("offline"); ind.innerText = "OFFLINE"; }
        if (typeof stopMockStream === "function") stopMockStream();
      } else {
        this.address = accounts[0];
        if (document.getElementById("addr-display")) document.getElementById("addr-display").innerText = this.address;
        await this.refreshBalances();
      }
    } catch (e) {
      console.error("onAccountsChanged handler error:", e);
    }
  },

  async _onChainChanged() {
    try { await this.refreshBalances(); } catch (e) { console.error(e); }
  },

  async refreshBalances() {
    if (!this.provider || !this.address) return;
    try {
      const stt = await this.provider.getBalance(this.address);
      if (document.getElementById("balance-stt")) document.getElementById("balance-stt").innerText = Number(ethers.utils.formatEther(stt)).toFixed(4);

      // PAC balance via provider
      const pacRead = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.provider);
      const balPAC = await pacRead.balanceOf(this.address);
      if (document.getElementById("balance-pac")) document.getElementById("balance-pac").innerText = Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(2);
    } catch (err) {
      console.error("Balance error:", err);
      if (document.getElementById("balance-stt")) document.getElementById("balance-stt").innerText = "-";
      if (document.getElementById("balance-pac")) document.getElementById("balance-pac").innerText = "-";
    }
  },

  async startGame() {
    if (!this.provider || !this.signer) {
      alert("Silakan hubungkan wallet terlebih dahulu.");
      return false;
    }
    try {
      const tx = await this.signer.sendTransaction({
        to: window.CONTRACTS.TREASURY,
        value: ethers.utils.parseEther("0.01")
      });
      console.log("StartGame tx:", tx.hash);
      // refresh balances shortly
      setTimeout(()=>this.refreshBalances(), 3000);
      return true;
    } catch (err) {
      console.error("startGame tx error:", err);
      alert("Pembayaran STT gagal atau ditolak.");
      return false;
    }
  },

  /* TRY ON-CHAIN SWAP: transferFrom(treasury -> user)
     NOTE: transferFrom requires treasury to approve spender (signer) OR treasury own the flow.
     If this fails, we fallback to simulated swap and give clear instruction.
  */
  async swapScoreOnChain(score) {
    if (!this.pacContract || !this.address) {
      alert("Wallet belum terkoneksi.");
      return false;
    }
    if (score < 10) {
      alert("Minimal 10 poin untuk swap.");
      return false;
    }

    const pacAmount = Math.floor(score / window.SWAP_CONFIG.RATE);
    if (pacAmount <= 0) {
      alert("Skor tidak cukup untuk swap.");
      return false;
    }

    const pacRaw = ethers.utils.parseUnits(pacAmount.toString(), 18);

    try {
      // coba transferFrom(treasury -> user)
      // signer will attempt to call transferFrom; this will only succeed if treasury has approved the signer OR contract allows it.
      const tx = await this.pacContract.transferFrom(window.CONTRACTS.TREASURY, this.address, pacRaw);
      console.log("swap tx sent:", tx.hash);
      await tx.wait();
      await this.refreshBalances();
      alert(`Swap sukses: ${pacAmount} PAC diterima.`);
      return true;
    } catch (err) {
      console.warn("On-chain swap failed:", err);
      // fallback: show clear message & log swap as pending / simulated
      alert("Swap on-chain gagal (treasury approval dibutuhkan). Swap disimpan sebagai SIMULASI. Admin harus kirim PAC ke wallet kamu nanti.");
      // simpan swap request locally (so admin can pick it up)
      const pending = JSON.parse(localStorage.getItem("pending_swaps")||"[]");
      pending.push({ wallet: this.address, score, pacAmount, ts: Date.now() });
      localStorage.setItem("pending_swaps", JSON.stringify(pending));
      return false;
    }
  },

  // convenience wrapper used by UI: tries on-chain then fallback simulated result already handled
  async swapScore(score) {
    return await this.swapScoreOnChain(score);
  }
};

// wire connect button (if exists)
const btnConn = document.getElementById("btn-connect");
if (btnConn) btnConn.onclick = async () => { await DreamWeb3.connect(); };
