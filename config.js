// config.js — FINAL
window.SOMNIA_CHAIN = {
  chainId: "0x13A7", // Somnia Mainnet chainId 5031 => 0x13a7 (pastikan sesuai wallet)
  chainName: "Somnia Mainnet",
  nativeCurrency: { name: "Somnia Main Token", symbol: "SOMI", decimals: 18 },
  rpcUrls: ["https://api.infra.mainnet.somnia.network"],
  blockExplorerUrls: ["https://explorer.somnia.network"]
};

// Ganti dengan alamat contract leaderboard yang sudah anda deploy (Mainnet)
window.CONTRACTS = {
  LEADERBOARD: "0xD76b767102f2610b0C97FEE84873c1fAA4c7C365"
};

// ABI contract PacmanLeaderboard (sesuai yang sudah anda deploy)
window.PACMAN_ABI = [
  {"inputs":[{"internalType":"address","name":"_treasury","type":"address"},{"internalType":"uint256","name":"_startFeeWei","type":"uint256"},{"internalType":"uint256","name":"_maxScorePerSubmit","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"GameStarted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"score","type":"uint256"}],"name":"ScoreSubmitted","type":"event"},
  {"inputs":[],"name":"getTop10","outputs":[{"internalType":"address[]","name":"topPlayers","type":"address[]"},{"internalType":"uint256[]","name":"scores","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"startGame","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"score","type":"uint256"}],"name":"submitScore","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

window.GAME_CONFIG = {
  PLAY_FEE_SOMI: "0.01", // biaya start per play (SOMI)
  MAX_SCORE_PER_SUBMIT: 3000
};
