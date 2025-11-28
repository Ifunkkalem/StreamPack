/* config.js — FINAL SOMNIA */

window.SOMNIA_CHAIN = {
  chainId: "0xC456",
  chainName: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18
  },
  rpcUrls: ["https://rpc.testnet.somnia.network"],
  blockExplorerUrls: ["https://explorer.testnet.somnia.network"]
};

window.SOMNIA_RPC = "https://rpc.testnet.somnia.network";

/* ✅ KONTRAK ONCHAIN */
window.CONTRACTS = {
  // ✅ TOKEN PAC (ERC20)
  PAC_TOKEN: "0xf0993eb1fE7a5368778c4B5a8aE52c0fd503E7c9",

  // ✅ KONTRAK REWARD PACMAN (START GAME + SUBMIT SCORE)
  REWARD: "0x3fcb2265EE7d8d854c8a1e5BCc6d0c16d90E88e1"
};

/* ✅ ABI TOKEN PAC (MINIMAL) */
window.ABI = {
  PAC: [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)"
  ]
};
