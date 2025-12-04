/* ================================
   SOMNIA MAINNET CONFIG (FINAL)
   ================================ */

/* === CHAIN CONFIG === */
window.SOMNIA_CHAIN = {
  chainId: "0x13a7", // 5031
  chainName: "Somnia Mainnet",
  nativeCurrency: {
    name: "Somnia",
    symbol: "SOMI",
    decimals: 18
  },
  rpcUrls: [
    "https://api.infra.mainnet.somnia.network"
  ],
  blockExplorerUrls: []
};


/* ================================
   CONTRACT ADDRESSES (GANTI INI)
   ================================ */
window.CONTRACTS = {
  // ✅ GANTI DENGAN ALAMAT CONTRACT PACMAN LEADERBOARD ANDA
  LEADERBOARD: "0xD76b767102f2610b0C97FEE84873c1fAA4c7C365",

  // ✅ GANTI DENGAN WALLET PENERIMA 0.01 SOMI JIKA BERBEDA
  TREASURY: "0x5AC9aEd51B53950316c6F7d185f3eE204f200D32"
};


/* ================================
   GAME ECONOMY
   ================================ */
window.GAME_CONFIG = {
  PLAY_FEE_SOMI: "0.01",       // biaya main
  PLAY_FEE_WEI: "10000000000000000" // 0.01 SOMI in wei
};


/* ================================
   PACMAN LEADERBOARD ABI (FINAL)
   ================================ */
window.PACMAN_ABI = [
  {
    "inputs": [],
    "stateMutability": "payable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTop10",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startFeeWei",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


/* ================================
   UI DEFAULT STATE
   ================================ */
window.APP_STATE = {
  network: "SOMNIA_MAINNET",
  game: "PACMAN_HALLOWEEN",
  status: "READY"
};

console.log("✅ Somnia Mainnet Config Loaded");
console.log("Chain:", window.SOMNIA_CHAIN);
console.log("Contracts:", window.CONTRACTS);
