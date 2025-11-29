// config.js — FINAL (perbaikan alamat PAC)
window.SOMNIA_CHAIN = {
  chainId: "0xC488", // 50312
  chainName: "Somnia Testnet",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network/"]
};

window.CONTRACTS = {
  PAC_TOKEN: "0xf0993eb1fE7a5368778c4B5a8aE52c0fd503E7c9", // <-- perbaikan (leading f)
  TREASURY: "0x5AC9aFd5BF35950316c6EF7d185f3e204f200D32" // owner / treasury (dari explorer)
};

window.ABI = {
  PAC: [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ]
};

window.SWAP_CONFIG = {
  RATE: 10,         // 10 score = 1 PAC
  FEE_STT: "0.005"  // fee STT untuk swap (string in ETH units) — pembayaran ke TREASURY
};
