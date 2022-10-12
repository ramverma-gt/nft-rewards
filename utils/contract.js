const { Contract, ethers } = require("ethers");
const { NFT_MANAGER_ADDRESS, rpcUrls } = require("../constants");
const NFT_MANAGER_ABI = require("../constants/ABI.json");

function nftManagerContract(chainId) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrls[Number(chainId)])
  return new Contract(NFT_MANAGER_ADDRESS[Number(chainId)], NFT_MANAGER_ABI, provider);
};

module.exports = {
  nftManagerContract
}
