/* config.js — FINAL */
window.SOMNIA_CHAIN = {
  chainId: "0xC488", // 50312
  chainName: "Somnia Testnet",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network"]
};

// Gunakan address yang Anda sebutkan (PAC) dan reward contract yang sudah Anda deploy
window.CONTRACTS = {
  PAC_TOKEN: "0xf0993eb1fE7a5368778c4B5a8aE52c0fd503E7c9",        // PAC token
  REWARD_CONTRACT: "0x3fcb2265EE7d8d854c8a1e5BCc6d0c16d90E88e1" // PacmanReward (contoh dari tx Anda)
};

// Minimal ABIs yang dipakai app
window.ABI = {
  PAC: [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)"
  ],
  REWARD: [
    "function startGame() payable",
    "function submitScore(uint256 points) payable",
    "function startFee() view returns (uint256)",
    "function claimFee() view returns (uint256)"
  ]
};
