/* web3.js — DreamStream v2 FINAL FIXED */

async function waitForEthereum() {
  return new Promise((resolve) => {
    if (window.ethereum) return resolve(window.ethereum);
    let tries = 0;
    const iv = setInterval(() => {
      if (window.ethereum || tries > 20) {
        clearInterval(iv);
        resolve(window.ethereum);
      }
      tries++;
    }, 150);
  });
}

window.Web3Somnia = {
  provider: null,
  signer: null,
  address: null,

  async connect() {
    await waitForEthereum();
    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan.");
      return;
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = this.provider.getSigner();
    this.address = await this.signer.getAddress();

    document.getElementById("addr-display").innerText = this.address;
    this.updateBalances();
    return this.address;
  },

  async updateBalances() {
    // STT native
    const balSTT = await this.provider.getBalance(this.address);
    document.getElementById("balance-stt").innerText = ethers.utils.formatEther(balSTT);

    // PAC token
    const pac = new ethers.Contract(
      window.CONTRACTS.PAC_TOKEN,
      window.ABI.PAC,
      this.provider
    );
    const balPAC = await pac.balanceOf(this.address);
    document.getElementById("balance-pac").innerText = ethers.utils.formatUnits(balPAC, 18);
  }
};

document.getElementById("btn-connect").onclick = () => Web3Somnia.connect();
