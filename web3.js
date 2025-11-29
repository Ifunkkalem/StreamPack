/* ================================
   DREAMSTREAM WEB3 FINAL FIX
   ================================ */

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
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [window.SOMNIA_CHAIN]
        });
        return true;
      }
      return false;
    }
  } catch (e) {
    return false;
  }
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,

  /* ================= CONNECT ================= */
  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan.");
      return null;
    }

    const ok = await ensureSomniaChain();
    if (!ok) {
      alert("Gagal switch ke Somnia Testnet.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);

      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      window.IS_CONNECTED = true;

      const addrEl = document.getElementById("addr-display");
      if (addrEl) addrEl.innerText = this.address;

      const ind = document.getElementById("live-indicator");
      if (ind) {
        ind.classList.remove("offline");
        ind.classList.add("online");
        ind.innerText = "ONLINE";
      }

      await this.refreshBalances();

      return this.address;
    } catch (err) {
      console.error("CONNECT ERROR:", err);
      alert("Gagal connect wallet.");
      return null;
    }
  },

  /* ================= BALANCE ================= */
  async refreshBalances() {
    if (!this.provider || !this.address) return;

    try {
      const stt = await this.provider.getBalance(this.address);
      const sttEl = document.getElementById("balance-stt");
      if (sttEl) {
        sttEl.innerText = Number(ethers.utils.formatEther(stt)).toFixed(4);
      }

      const pac = new ethers.Contract(
        window.CONTRACTS.PAC_TOKEN,
        window.ABI.PAC,
        this.provider
      );

      const balPAC = await pac.balanceOf(this.address);
      const pacEl = document.getElementById("balance-pac");
      if (pacEl) {
        pacEl.innerText = Number(
          ethers.utils.formatUnits(balPAC, 18)
        ).toFixed(2);
      }
    } catch (e) {
      console.error("BALANCE ERROR:", e);
    }
  },

  /* ================= START GAME ================= */
  async startGame() {
    if (!window.ethereum || !this.provider || !this.signer) {
      alert("Wallet belum siap.");
      return false;
    }

    try {
      const addr = await this.signer.getAddress();
      const bal = await this.provider.getBalance(addr);

      if (bal.lt(ethers.utils.parseEther("0.01"))) {
        alert("STT tidak cukup (butuh 0.01 STT)");
        return false;
      }

      const tx = await this.signer.sendTransaction({
        to: window.CONTRACTS.TREASURY,
        value: ethers.utils.parseEther("0.01")
      });

      console.log("START GAME TX:", tx.hash);
      await tx.wait(1);

      setTimeout(() => this.refreshBalances(), 1500);
      return true;
    } catch (err) {
      console.error("START GAME FAILED:", err);
      alert("Pembayaran STT gagal / dibatalkan.");
      return false;
    }
  },

  /* ================= SWAP ================= */
  async requestSwap(points) {
    if (!this.signer || !this.address) {
      return { success: false, message: "Wallet belum connect." };
    }

    const pts = Number(points || 0);
    if (pts < window.SWAP_CONFIG.RATE) {
      return { success: false, message: "Poin belum cukup." };
    }

    const pacAmount = Math.floor(
      pts / window.SWAP_CONFIG.RATE
    );

    try {
      if (window.SWAP_CONFIG.FEE_STT) {
        const tx = await this.signer.sendTransaction({
          to: window.CONTRACTS.TREASURY,
          value: ethers.utils.parseEther(window.SWAP_CONFIG.FEE_STT)
        });

        console.log("SWAP FEE TX:", tx.hash);
        await tx.wait();
      }
    } catch (err) {
      console.error("SWAP FEE FAILED:", err);
      return { success: false, message: "Fee swap dibatalkan." };
    }

    const req = {
      id: "swap_" + Date.now(),
      wallet: this.address,
      points: pts,
      pac: pacAmount,
      time: Date.now(),
      status: "pending"
    };

    const data = JSON.parse(localStorage.getItem("swap_requests") || "[]");
    data.unshift(req);
    localStorage.setItem("swap_requests", JSON.stringify(data));

    return { success: true, pac: pacAmount, request: req };
  }
};

/* ================= BUTTON BINDING ================= */

document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
