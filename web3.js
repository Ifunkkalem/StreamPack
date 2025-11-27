/* web3.js — FINAL ONCHAIN VERSION (STT + PAC REAL TX) */

const STT_FEE = "0.01"; // biaya main
const PAC_ADDRESS = "0xf0993eb1fE7a5368778c4B5a8aE52c0fd503E7c9";
const PAC_DECIMALS = 18;

// ABI MINIMAL ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

window.DreamWeb3 = {
  provider: null,
  signer: null,
  address: null,

  async connect() {
    if (!window.ethereum) {
      alert("Metamask tidak ditemukan");
      return false;
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = this.provider.getSigner();
    this.address = await this.signer.getAddress();

    document.getElementById("addr-display").innerText = this.address;
    document.getElementById("live-indicator").classList.remove("offline");

    if (window.afterWalletConnected) window.afterWalletConnected();
    return true;
  },

  /* ============================
     ✅ START GAME → TX STT FEE
     ============================ */
  async startGame() {
    try {
      const tx = await this.signer.sendTransaction({
        to: this.address, // testnet self-send (biar tx tetap ada)
        value: ethers.utils.parseEther(STT_FEE)
      });

      await tx.wait();
      return true;
    } catch (e) {
      console.error("startGame error:", e);
      return false;
    }
  },

  /* ============================
     ✅ SWAP SCORE → PAC ONCHAIN
     10 SCORE = 1 PAC
     ============================ */
  async swapScore(scoreAmount) {
    try {
      const pacAmount = Math.floor(scoreAmount / 10);
      if (pacAmount <= 0) throw "Score terlalu kecil";

      const pacContract = new ethers.Contract(
        PAC_ADDRESS,
        ERC20_ABI,
        this.signer
      );

      const amountWei = ethers.utils.parseUnits(
        String(pacAmount),
        PAC_DECIMALS
      );

      // ✅ TRANSFER PAC KE PLAYER (ONCHAIN)
      const tx = await pacContract.transfer(this.address, amountWei);
      await tx.wait();

      return `✅ Swap sukses! +${pacAmount} PAC masuk ke wallet`;
    } catch (e) {
      console.error("swapScore error:", e);
      return null;
    }
  },

  /* ============================
     ✅ REFRESH BALANCE STT & PAC
     ============================ */
  async refreshBalances() {
    try {
      const stt = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        ethers.utils.formatEther(stt);

      const pacContract = new ethers.Contract(
        PAC_ADDRESS,
        ERC20_ABI,
        this.provider
      );

      const pac = await pacContract.balanceOf(this.address);
      document.getElementById("balance-pac").innerText =
        ethers.utils.formatUnits(pac, PAC_DECIMALS);

    } catch (e) {
      console.error("refreshBalances error:", e);
    }
  }
};

// tombol connect
document.getElementById("btn-connect").onclick = () => {
  DreamWeb3.connect();
};
