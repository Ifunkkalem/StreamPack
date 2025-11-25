/* web3.js — FINAL FIX */

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

  async connect() {
    await waitForEthereum();

    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan.");
      return;
    }

    const ok = await ensureSomniaChain();
    if (!ok) {
      alert("Tidak dapat menambahkan jaringan Somnia.");
      return;
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
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

      if (document.getElementById("toggle-sim").checked) {
        startMockStream();
      }

    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan wallet.");
    }
  },

  async refreshBalances() {
    try {
      const stt = await this.provider.getBalance(this.address);
      document.getElementById("balance-stt").innerText =
        Number(ethers.utils.formatEther(stt)).toFixed(4);

      const pac = new ethers.Contract(
        window.CONTRACTS.PAC_TOKEN,
        window.ABI.PAC,
        this.provider
      );

      const balPAC = await pac.balanceOf(this.address);
      document.getElementById("balance-pac").innerText =
        Number(ethers.utils.formatUnits(balPAC, 18)).toFixed(2);

    } catch (err) {
      console.error("Balance error:", err);
    }
  }
};

document.getElementById("btn-connect").onclick = async () => {
  await DreamWeb3.connect();
};
