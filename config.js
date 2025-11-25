/* config.js — DreamStream v2 FINAL */

window.SOMNIA_RPC = "https://dream-rpc.somnia.network";

window.SOMNIA_CHAIN = {
  chainId: "0xC488",
  chainName: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18
  },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network/"]
};

window.CONTRACTS = {
  PAC_TOKEN: "0xf0993eb1fE7a5368778c4B5a8aE52c0fd503E7c9"
};

window.ABI = {
  PAC: [
    {
      "constant": true,
      "inputs": [{"name": "owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"type": "uint256"}],
      "type": "function"
    }
  ]
};
