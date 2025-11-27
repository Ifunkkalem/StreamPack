/* config.js — FINAL Somnia Testnet */

window.SOMNIA_CHAIN = {
  chainId: "0xC488",              // 50312
  chainName: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18
  },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network/"]
};

/* ✅ PAC TOKEN (ALAMAT YANG KAMU KASIH KE SAYA) */
window.CONTRACTS = {
  PAC_TOKEN: "0x490cCDD439845E0D384BACE2aD2F5d874909360A"
};

/* ✅ ABI MINIMAL (AMAN UNTUK CSP & VERCEL) */
window.ABI = {
  PAC: [
    "function balanceOf(address owner) view returns (uint256)"
  ]
};
