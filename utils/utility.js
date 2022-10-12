const { ethers } = require("ethers");
const { rpcUrls } = require("../constants/index");

const getBlockNumber = async (chainId) => {
  const provider = new ethers.providers.JsonRpcProvider(
    rpcUrls[Number(chainId)]
  );
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
};

module.exports = {
  getBlockNumber,
};
