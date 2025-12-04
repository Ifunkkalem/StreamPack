/* web3.js — FINAL (parent, Somnia MAINNET) */
/* Requirements: config.js must provide:
   - window.SOMNIA_CHAIN (chainId mainnet)
   - window.CONTRACTS.LEADERBOARD (address of PacmanLeaderboard)
   - window.CONTRACTS.TREASURY (owner/treasury)
   - window.PACMAN_ABI (ABI array)
*/

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
    // try switch
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: window.SOMNIA_CHAIN.chainId }]
      });
      return true;
    } catch (switchErr) {
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
      alert("Please open this site in MetaMask browser or enable MetaMask extension.");
      return null;
    }

    const ok = await ensureSomniaChain();
    if (!ok) {
      alert("Cannot switch/add Somnia chain in MetaMask. Please add manually.");
      return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");

      if (window.ethereum.on) {
        window.ethereum.on("accountsChanged", async () => await this._onAccountsChanged());
        window.ethereum.on("chainChanged", async () => await this._onChainChanged());
      }

      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // update UI (parent must have element #addr-display)
      const addrEl = document.getElementById("addr-display");
      if (addrEl) addrEl.innerText = this.address;

      const ind = document.getElementById("live-indicator");
      if (ind) {
        ind.classList.remove("offline");
        ind.classList.add("online");
        ind.innerText = "ONLINE";
      }

      await this.refreshBalances();

      // notify app that wallet is ready
      if (typeof window.afterWalletConnected === "function") {
        try { window.afterWalletConnected(); } catch(e) { console.warn(e); }
      }

      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Failed to connect wallet.");
      return null;
    }
  },

  async _onAccountsChanged() {
    try {
      const accounts = await this.provider.send("eth_accounts", []);
      if (!accounts || accounts.length === 0) {
        // disconnected
        this.address = null;
        const addrEl = document.getElementById("addr-display");
        if (addrEl) addrEl.innerText = "Not connected";
        const ind = document.getElementById("live-indicator");
        if (ind) { ind.classList.remove("online"); ind.classList.add("offline"); ind.innerText = "OFFLINE"; }
        if (typeof stopMockStream === "function") stopMockStream();
      } else {
        this.address = accounts[0];
        const addrEl = document.getElementById("addr-display");
        if (addrEl) addrEl.innerText = this.address;
        await this.refreshBalances();
      }
    } catch (e) {
      console.error("onAccountsChanged error:", e);
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
      const bal = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt") && (document.getElementById("balance-stt").innerText = Number(ethers.utils.formatEther(bal)).toFixed(4));
      // PAC token may not exist in this mainnet scenario (we're using leaderboard only)
      if (window.CONTRACTS && window.CONTRACTS.PAC_TOKEN) {
        const pac = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI && window.ABI.PAC ? window.ABI.PAC : [], this.provider);
        try {
          const b = await pac.balanceOf(this.address);
          const dec = (await pac.decimals?.()) || 18;
          document.getElementById("balance-pac") && (document.getElementById("balance-pac").innerText = Number(ethers.utils.formatUnits(b, dec)).toFixed(2));
        } catch(e) {
          document.getElementById("balance-pac") && (document.getElementById("balance-pac").innerText = "-");
        }
      }
    } catch (err) {
      console.error("refreshBalances error:", err);
    }
  },

  /* Start game: send start fee (0.01 SOMI) to the leaderboard contract or treasury */
  async startGame() {
    if (!this.provider || !this.signer) {
      alert("Wallet not connected.");
      return false;
    }
    try {
      // default pay to leaderboard contract address (it is payable startGame)
      const target = window.CONTRACTS && window.CONTRACTS.LEADERBOARD ? window.CONTRACTS.LEADERBOARD : window.CONTRACTS.TREASURY;
      if (!target) {
        alert("Missing CONTRACTS.LEADERBOARD in config.js");
        return false;
      }

      const feeWei = ethers.utils.parseEther("0.01"); // 0.01 SOMI
      const tx = await this.signer.sendTransaction({ to: target, value: feeWei });
      console.log("startGame tx:", tx.hash);
      await tx.wait(1);
      // refresh balances quick
      setTimeout(()=> this.refreshBalances(), 1500);
      return true;
    } catch (err) {
      console.error("startGame error:", err);
      return false;
    }
  },

  /* Submit score on-chain (calls contract.submitScore(uint256)) */
  async submitScore(score) {
    if (!this.provider || !this.signer) {
      return { success: false, message: "Wallet not connected." };
    }
    if (!window.PACMAN_ABI || !window.CONTRACTS || !window.CONTRACTS.LEADERBOARD) {
      return { success: false, message: "Contract ABI or address missing in config.js" };
    }
    try {
      const contract = new ethers.Contract(window.CONTRACTS.LEADERBOARD, window.PACMAN_ABI, this.signer);
      const tx = await contract.submitScore(score);
      console.log("submitScore tx:", tx.hash);
      await tx.wait(1);
      // refresh leaderboards after success
      return { success: true };
    } catch (err) {
      console.error("submitScore error:", err);
      return { success: false, message: err && err.message ? err.message : "submit failed" };
    }
  },

  /* Fetch top10 (read-only) */
  async fetchTop10() {
    if (!this.provider) {
      return { addrs: [], scores: [] };
    }
    try {
      if (!window.CONTRACTS || !window.CONTRACTS.LEADERBOARD || !window.PACMAN_ABI) return { addrs: [], scores: [] };
      const contract = new ethers.Contract(window.CONTRACTS.LEADERBOARD, window.PACMAN_ABI, this.provider);
      const res = await contract.getTop10();
      // res: [addrs[], scores[]]
      return { addrs: res[0], scores: res[1] };
    } catch (err) {
      console.error("fetchTop10 error:", err);
      return { addrs: [], scores: [] };
    }
  }
};

// connect button binding (assumes #btn-connect exists)
document.getElementById("btn-connect") && (document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
});
