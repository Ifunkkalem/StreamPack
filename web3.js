/* web3.js — FINAL (connect, balances, startGame, requestSwap) */

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

  async connect() {
    await waitForEthereum();
    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan. Buka lewat browser MetaMask.");
      return null;
    }

    const ok = await ensureSomniaChain();
    if (!ok) {
      alert("Gagal menambahkan / switch ke Somnia Testnet.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");

      // register handlers
      if (window.ethereum.on) {
        window.ethereum.on("accountsChanged", async () => await this._onAccountsChanged());
        window.ethereum.on("chainChanged", async () => await this._onChainChanged());
      }

      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      document.getElementById("addr-display").innerText = this.address;
      const ind = document.getElementById("live-indicator");
      if (ind) {
        ind.classList.remove("offline");
        ind.classList.add("online");
        ind.innerText = "ONLINE";
      }

      await this.refreshBalances();

      // notify parent app that wallet connected
      if (typeof window.afterWalletConnected === "function") {
        try { window.afterWalletConnected(); } catch(e) {}
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
        this.address = null;
        window.IS_CONNECTED = false;
        document.getElementById("addr-display").innerText = "Not connected";
        const ind = document.getElementById("live-indicator");
        if (ind) {
          ind.classList.remove("online");
          ind.classList.add("offline");
          ind.innerText = "OFFLINE";
        }
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
    try {
      await this.refreshBalances();
    } catch (e) { console.error(e); }
  },

  async refreshBalances() {
    if (!this.provider || !this.address) {
      document.getElementById("balance-stt") && (document.getElementById("balance-stt").innerText = "-");
      document.getElementById("balance-pac") && (document.getElementById("balance-pac").innerText = "-");
      return;
    }
    try {
      const stt = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(stt)).toFixed(4);

      const pac = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.provider);
      const balPAC = await pac.balanceOf(this.address);
      const decimals = 18;
      document.getElementById("balance-pac").innerText =
        Number(ethers.utils.formatUnits(balPAC, decimals)).toFixed(2);
    } catch (err) {
      console.error("Balance error:", err);
      document.getElementById("balance-stt").innerText = "-";
      document.getElementById("balance-pac").innerText = "-";
    }
  },

  async startGame() {
  if (!this.provider || !this.signer) {
    alert("Wallet belum benar-benar terhubung. Silakan connect ulang.");
    return false;
  }

  try {
    // ✅ Pastikan signer benar-benar aktif
    const addr = await this.signer.getAddress();
    if (!addr) throw new Error("Signer tidak valid");

    const tx = await this.signer.sendTransaction({
      to: window.CONTRACTS.TREASURY, // ✅ KIRIM KE TREASURY, BUKAN KE DIRI SENDIRI
      value: ethers.utils.parseEther("0.01")
    });

    console.log("StartGame tx hash:", tx.hash);

    // ✅ Tunggu 1 konfirmasi biar benar-benar valid
    await tx.wait(1);

    setTimeout(() => {
      this.refreshBalances();
    }, 2000);

    return true;
  } catch (err) {
    console.error("startGame tx error:", err);
    return false;
  }
}

  /**
   * requestSwap(points)
   * - verify points
   * - compute pac amount
   * - if FEE_STT configured -> send fee STT to TREASURY
   * - save swapRequest in localStorage so owner/backend dapat memproses
   */
  async requestSwap(points) {
    if (!this.signer || !this.address) {
      return { success: false, message: "Connect wallet dulu." };
    }
    const pts = Number(points || 0);
    if (!pts || pts < 10) {
      return { success: false, message: "Minimal 10 poin untuk swap." };
    }

    const pacAmount = Math.floor(pts / window.SWAP_CONFIG.RATE);
    if (pacAmount <= 0) {
      return { success: false, message: "Tidak ada PAC yang didapatkan." };
    }

    // optional fee STT payment
    const fee = window.SWAP_CONFIG.FEE_STT || null;
    try {
      if (fee) {
        const tx = await this.signer.sendTransaction({
          to: window.CONTRACTS.TREASURY,
          value: ethers.utils.parseEther(fee)
        });
        console.log("swap fee tx:", tx.hash);
        await tx.wait();
      }
    } catch (feeErr) {
      console.error("Swap fee tx failed:", feeErr);
      return { success: false, message: "Pembayaran fee STT gagal atau dibatalkan." };
    }

    // Create swap request object (owner/backend must process and send PAC on-chain)
    const swapRequest = {
      id: `swap_${Date.now()}`,
      wallet: this.address,
      points: pts,
      pac: pacAmount,
      timestamp: Date.now(),
      status: "pending"
    };

    // Save to localStorage (owner can read localStorage when using same browser),
    // but better: send to backend. We'll save to array of requests.
    let arr = JSON.parse(localStorage.getItem("swap_requests") || "[]");
    arr.unshift(swapRequest);
    localStorage.setItem("swap_requests", JSON.stringify(arr));

    // also save to leaderboard: remove points used
    let lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    // we assume current wallet has one entry; here we only push claim record
    lb.unshift({ score: 0, swapped: pts, time: Date.now() });
    localStorage.setItem("leaderboard", JSON.stringify(lb.slice(0, 200)));

    // notify UI
    if (typeof addActivity === "function") {
      addActivity(`[swap] Request saved: ${swapRequest.id} → ${pacAmount} PAC (pending)`);
    }

    return { success: true, pac: pacAmount, request: swapRequest };
  }
};

// connect button binding
document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
