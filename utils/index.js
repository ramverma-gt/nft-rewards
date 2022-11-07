// import { IKeysValues } from "@makerdao/multicall";
// import { StakeV2 } from "../typings";

const { getBlockNumber } = require("./utility");

// import { BigNumber } from "ethers";
const { nftManagerContract } = require("./contract");
const { getUserMints } = require("./graphNfts");
const {
  createCalls,
  fetchUserNFts,
  createCallsForFarmData,
  multicall,
} = require("./multicall");
const { fetchClaimData } = require("./userClaimNfts");
const { fetchV2Farms, formatFarmData } = require("./farm");
const { isEmpty, divide, subtract, multiply, add } = require("lodash");
const { unitFormatter } = require("./farm");
const { getV2Rewards } = require("./rewards");
const { BLOCK_TIME } = require("../constants");

const getBlockDiffrence = (
  /** to block */
  to,
  /** from block */
  from
) => {
  return subtract(to, from);
};

const getFarmEndTime = (
  /** deployAt */
  deployAt,
  /** endBlock */
  endBlock,
  /** start block */
  startBlock,
  /**chain Id  */
  chainId
) => {
  if (!deployAt || !endBlock || !startBlock) return null;
  let blockDiffrence = getBlockDiffrence(endBlock, startBlock);
  let duration = multiply(blockDiffrence, BLOCK_TIME[chainId]);
  return add(deployAt, duration);
};

const getStartCheckpoint = (
  /** cohort start block */
  startBlock,
  /** cohort end block */
  endBlock,
  /** blocks in single checkpoint  */
  checkpointBlocks
) => {
  return Math.trunc(
    divide(getBlockDiffrence(endBlock, startBlock), checkpointBlocks)
  );
};

const getEndCheckpoint = (
  /** user start checkpoint */
  startBlock,
  /** user end block */
  endBlock,
  /** blocks in single checkpoint */
  checkpointBlocks,
  /** cohort end block */
  cEndBlock
) => {
  if (endBlock > cEndBlock) {
    endBlock = cEndBlock;
  }
  return Math.trunc(
    divide(getBlockDiffrence(endBlock, startBlock), checkpointBlocks)
  );
};

const computeStakingConfirmedRewards = (
  /** particular farm */
  farm,
  /** staking object */
  stake,
  /** current blocknumber */
  blockNumber
) => {
  if (isEmpty(farm) || isEmpty(stake)) return null;

  let { cohort, farmDetails, farmData, token } = farm || {};

  // start check point
  let startCheckpoint = getStartCheckpoint(
    cohort?.startBlock,
    stake?.startBlock,
    cohort?.epochBlocks
  );

  // current check point
  let currentCheckpoint = getEndCheckpoint(
    cohort?.startBlock,
    blockNumber,
    cohort?.epochBlocks,
    cohort?.endBlock
  );

  let stakedAmount = unitFormatter(
    stake?.stakedAmount,
    parseInt(token?.decimals)
  );

  console.log("stakedAmount", stakedAmount);

  // deriving stable rewards
  let stableRewards = getV2Rewards({
    rewards: farmDetails?.rewards,
    pbr: farmDetails?.perBlockRewards,
    epochBlocks: cohort?.epochBlocks,
    userStakedBlock: stake?.startBlock - cohort?.startBlock,
    startCheckpoint,
    currentCheckpoint,
    stakedAmount,
    totalStakeLimit: token?.totalStakeLimit,
    priorCheckpointTVLs: farmData[0]?.farmData.priorEpochTvls,
    cohortVersion: cohort?.cohortVersion,
    deriveBothAPY: false,
    isBoosted: stake?.hasBoosterBuyed,
    totalStaking: farmData[0]?.farmData.activeStaking,
    endBlock: cohort?.endBlock,
  });

  console.log("stableRewards", stableRewards);

  return {
    rewardTokens: stableRewards?.rewardsTokenMetaData,
    rewardsInUsd: stableRewards?.totalEarnedValueInUsd,
  };
};

const fetchRewardForNft = async (chainId, nftId) => {
  const userNft = [];
  const nfts = await fetchUserNFts(chainId, nftId);

  const v2Farms = await fetchV2Farms(chainId, nfts[0].farmId);
  const blockNumber = await getBlockNumber(chainId);

  const calls = createCallsForFarmData(v2Farms, chainId);
  const callResults = await multicall(chainId, calls);

  const farmOriginal = callResults.results.original;

  console.log("farmOriginal", farmOriginal);

  const farmData = formatFarmData(v2Farms, blockNumber, farmOriginal, chainId);

  const farm = {
    farmDetails: v2Farms[0].farmDetails,
    cohort: v2Farms[0].cohort,
    token: v2Farms[0].token,
    farmData,
  };

  // const claims = await fetchClaimData(nfts, farm);

  // console.log("claims", claims);

  const { rewardTokens, rewardsInUsd } = computeStakingConfirmedRewards(
    farm,
    nfts[0],
    blockNumber
  );

  // console.log("filteredFarms[0].farmDetails.", filteredFarms[0].farmDetails);

  userNft.push({
    nfts,
    rewardToken: {
      tokens: v2Farms[0].farmDetails.rewardTokenAddress,
    },
  });

  const rewards = rewardTokens.map((e, i) => {
    return {
      token: userNft[0].rewardToken.tokens[i],
      amount: e.boostedRewardValue ? e.boostedRewardValue : e.rewardValue,
    };
  });

  return {
    userNft,
    rewards,
    rewardsInUsd,
  };
};

const roundValue = (value, roundTo) => {
  return Math.floor(value * 10 ** roundTo) / 10 ** roundTo;
};

module.exports = {
  // getNftOwner,
  fetchRewardForNft,
  roundValue,
  getFarmEndTime,
};
