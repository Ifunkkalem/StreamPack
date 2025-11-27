/* web3.js — DreamStream PRO+ FINAL (mobile-safe) */

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

/* try switch chain, if not exist then add */
async function ensureSomniaChain() {
  try {
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current === window.SOMNIA_CHAIN.chainId) return true;

    // try switch
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: window.SOMNIA_CHAIN.chainId }]
      });
      return true;
    } catch (switchErr) {
      // if chain not found, add it
      if (switchErr && switchErr.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [window.SOMNIA_CHAIN]
          });
          return true;
        } catch (addErr) {
          console.error("wallet_addEthereumChain failed:", addErr);
          return false;
        }
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

  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan. Buka lewat browser MetaMask.");
      return null;
    }

    // Pastikan chain Somnia tersedia / ter-switch
    const okChain = await ensureSomniaChain();
    if (!okChain) {
      alert("Gagal menambahkan / mengalihkan ke jaringan Somnia Testnet.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      // listen chain/account changes to refresh state
      window.ethereum.on && window.ethereum.on("accountsChanged", async () => {
        await this._onAccountsChanged();
      });
      window.ethereum.on && window.ethereum.on("chainChanged", async () => {
        await this._onChainChanged();
      });

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

      // Aktifkan mock stream hanya setelah benar-benar connected
      if (document.getElementById("toggle-sim") && document.getElementById("toggle-sim").checked) {
        if (typeof startMockStream === "function") startMockStream();
      }

      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet atau mengambil alamat.");
      return null;
    }
  },

  async _onAccountsChanged() {
    try {
      const accounts = await this.provider.send("eth_accounts", []);
      if (!accounts || accounts.length === 0) {
        // disconnected
        window.IS_CONNECTED = false;
        document.getElementById("addr-display").innerText = "Not connected";
        const ind = document.getElementById("live-indicator");
        ind.classList.remove("online");
        ind.classList.add("offline");
        ind.innerText = "OFFLINE";
        // stop mock stream
        if (typeof stopMockStream === "function") stopMockStream();
      } else {
        this.address = accounts[0];
        document.getElementById("addr-display").innerText = this.address;
        await this.refreshBalances();
      }
    } catch (e) {
      console.error("onAccountsChanged handler error:", e);
    }
  },

  async _onChainChanged() {
    // refresh balances and UI
    try {
      await this.refreshBalances();
    } catch (e) {
      console.error("onChainChanged handler error:", e);
    }
  },

  async refreshBalances() {
    if (!this.provider || !this.address) return;
    try {
      const stt = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(stt)).toFixed(4);

      const pac = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.provider);
      const balPAC = await pac.balanceOf(this.address);
      document.getElementById("balance-pac").innerText =
        Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(2);
    } catch (err) {
      console.error("Balance error:", err);
      // fallback UI
      document.getElementById("balance-stt").innerText = "-";
      document.getElementById("balance-pac").innerText = "-";
    }
  },

  /* Start game — kirim STT (demo) -> FAULT TOLERANT: tidak menunggu tx.wait() lama */
  async startGame() {
    if (!this.provider || !this.signer) {
      alert("Silakan hubungkan wallet terlebih dahulu.");
      return false;
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: this.address, // dummy transfer ke diri sendiri sebagai simulasi biaya
        value: ethers.utils.parseEther("0.01")
      });

      // jangan await tx.wait() terlalu lama -> cukup simpan hash (demo)
      console.log("StartGame tx hash:", tx.hash);
      // update balance sedikit delay supaya RPC punya waktu
      setTimeout(() => {
        this.refreshBalances();
      }, 3000);

      return true;
    } catch (err) {
      console.error("startGame tx error:", err);
      return false;
    }
  },

  async swapScore(score) {
    if (score < 10) return "Minimal 10 poin.";
    const pac = Math.floor(score / 10);
    return `Swap simulasi: ${pac} PAC (tidak on-chain).`;
  }
};

// Connect button
document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
