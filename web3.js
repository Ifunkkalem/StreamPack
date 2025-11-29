/* web3.js — DreamStream v2 ONCHAIN FINAL
   Fitur:
   - connect()
   - ensureSomniaChain()
   - refreshBalances()
   - startGame() -> calls REWARD.startGame() payable 0.01 STT
   - claimScore(points) -> calls REWARD.submitScore(points) payable 0.001 STT
*/

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const i = setInterval(() => {
      if (window.ethereum || tries > 25) { clearInterval(i); resolve(window.ethereum); }
      tries++;
    }, 150);
  });
}

async function ensureSomniaChain() {
  if (!window.ethereum) return false;
  try {
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [window.SOMNIA_CHAIN] });
    return true;
  } catch (err) {
    console.warn("ensureSomniaChain failed:", err);
    return false;
  }
}

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,

  async connect() {
    await waitForEthereum();
    if (!window.ethereum) { alert("MetaMask tidak ditemukan. Buka lewat MetaMask browser."); return null; }

    const okChain = await ensureSomniaChain();
    if (!okChain) {
      const cont = confirm("Gagal menambahkan Somnia chain otomatis. Lanjutkan coba connect?");
      if (!cont) return null;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      // update UI
      const el = document.getElementById("addr-display");
      if (el) el.innerText = this.address;

      // set connected indicator
      const ind = document.getElementById("live-indicator");
      if (ind) { ind.classList.remove("offline"); ind.classList.add("online"); ind.innerText = "ONLINE"; }

      // update balances and notify parent app
      await this.refreshBalances();

      // call afterWalletConnected hook if exists
      if (typeof window.afterWalletConnected === "function") window.afterWalletConnected();

      console.log("[DreamWeb3] connected:", this.address);
      return this.address;
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet: " + (err.message||err));
      return null;
    }
  },

  async refreshBalances() {
    try {
      if (!this.provider || !this.address) return;
      // STT native balance
      const bal = await this.provider.getBalance(this.address);
      const sttEl = document.getElementById("balance-stt");
      if (sttEl) sttEl.innerText = Number(ethers.utils.formatEther(bal)).toFixed(4);

      // PAC token balance
      const pacContract = new ethers.Contract(window.CONTRACTS.PAC_TOKEN, window.ABI.PAC, this.provider);
      const balPAC = await pacContract.balanceOf(this.address);
      const pacEl = document.getElementById("balance-pac");
      if (pacEl) pacEl.innerText = Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(4);

      console.log("[DreamWeb3] balances updated");
    } catch (err) {
      console.error("refreshBalances error:", err);
    }
  },

  // Start game: call reward.startGame() payable 0.01 STT
  async startGame() {
    if (!this.signer) { alert("Connect wallet dulu."); return false; }
    try {
      const reward = new ethers.Contract(window.CONTRACTS.REWARD, window.ABI.REWARD, this.signer);
      const value = ethers.utils.parseEther("0.01"); // start fee
      const tx = await reward.startGame({ value });
      addActivity(`[onchain] startGame tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      addActivity(`[onchain] startGame confirmed: ${receipt.transactionHash}`);
      // refresh balances
      await this.refreshBalances();
      return true;
    } catch (err) {
      console.error("startGame error:", err);
      addActivity("[swap] Start game TX gagal atau dibatalkan.");
      return false;
    }
  },

  // Claim score -> call reward.submitScore(points) payable 0.001 STT
  async claimScore(points) {
  if (!this.signer) return { success:false };

  try {
    const reward = new ethers.Contract(
      window.CONTRACTS.REWARD,
      window.ABI.REWARD,
      this.signer
    );

    const tx = await reward.submitScore(points, {
      value: ethers.utils.parseEther("0.001") // ✅ FEE STT WAJIB ADA
    });

    addActivity(`[onchain] claim sent: ${tx.hash}`);

    const receipt = await tx.wait();
    addActivity(`[onchain] claim confirmed: ${receipt.transactionHash}`);

    await this.refreshBalances();
    return { success:true, txHash: receipt.transactionHash };

  } catch (err) {
    console.error(err);
    return { success:false, error: err.message };
  }
}

/* quick connect button hookup (if element exists) */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-connect");
  if (btn) btn.onclick = async () => { await window.DreamWeb3.connect(); };
});
