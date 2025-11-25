/* config.js — FINAL Somnia RPC */

window.SOMNIA_CHAIN = {
  chainId: "0xC488",
  chainName: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18
  },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network"]
};

/* PAC TOKEN (dummy address utk testnet) */
window.CONTRACTS = {
  PAC_TOKEN: "0x0000000000000000000000000000000000000001"
};

/* Minimal ABI supaya tidak error */
window.ABI = {
  PAC: [
    "function balanceOf(address owner) view returns (uint256)"
  ]
};
