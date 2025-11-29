// config.js — FINAL
window.SOMNIA_CHAIN = {
  chainId: "0xC488", // 50312
  chainName: "Somnia Testnet",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network/"]
};

window.CONTRACTS = {
  PAC_TOKEN: "0x0993eb1f7d538778c4b5d8ae52c0fd503e7c9", // dari explorer kamu
  TREASURY: "0x5AC9aFd5BF35950316c6EF7d185f3e204f200D32" // owner / treasury
};

window.ABI = {
  PAC: [
    // minimal ABI: balanceOf, transferFrom, transfer, allowance, decimals
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ]
};

window.SWAP_CONFIG = {
  RATE: 10,         // 10 score = 1 PAC
  FEE_STT: "0.005"  // optional fee for swap (STT) if you want to charge user; string in ETH units
};
