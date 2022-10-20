const NFT_MANAGER_ADDRESS = {
  // for ethereum rinkeby
  1: "0x87c45032b6A7e7B2D3fe99C68340C1F4b72ceBeD",
  // for bsc testnet
  56: "0x87c45032b6A7e7B2D3fe99C68340C1F4b72ceBeD",
  // for polygon testnet
  137: "0x179A6a8138A3eac7D588321ddAFd9797892783ed",
  // for avax c chain testnet
  43113: "",
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// // ETH RPC url
// const ethRpcUrl = process.env.REACT_APP_ETHEREUM_RPC_URL;
// // BSC RPC url
// const bscRpcUrl = process.env.REACT_APP_BSC_RPC_URL;
// // POLYGON RPC url
// const polygonRpcUrl = process.env.REACT_APP_POLYGON_RPC_URL;

const rpcUrls = {
  1: "https://dark-skilled-log.quiknode.pro/6b7af27a62c51a0d3521d798564cec476b938085/",
  56: "https://rpc.ankr.com/bsc",
  137: "https://orbital-dimensional-scion.matic.quiknode.pro/c966b74eb84428ed89c7ff564cfdb33c80116dc9/",
};

const multicallAddress = {
  1: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
  56: "0x41263cba59eb80dc200f3e2544eda4ed6a90e76c",
  137: "0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507",
  43114: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
};

// Cohort registry address
const COHORT_REGISTRYS = {
  // eth
  1: "0xdBB277570e1cB6FBec0ca34F126e08eA83ea29d8",
  // bsc
  56: "0xdBB277570e1cB6FBec0ca34F126e08eA83ea29d8",
  // polygon
  137: "0xE4279753d6921aC36c476CB68273284a84041F71",
  // avax
  43114: null,
};

const MAGIC_VALUES = ["0x1bcc0f4c", "0x8ca9a95e"];

const BLOCK_TIME = {
  1: 15,
  56: 3,
  137: 2.15,
};

const YEAR = 360;

module.exports = {
  multicallAddress,
  rpcUrls,
  ZERO_ADDRESS,
  NFT_MANAGER_ADDRESS,
  COHORT_REGISTRYS,
  MAGIC_VALUES,
  BLOCK_TIME,
  YEAR,
};
