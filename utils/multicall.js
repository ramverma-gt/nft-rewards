const { getUserNftTransfers } = require("./utility");
const { ethers } = require("ethers");
const {
  NFT_MANAGER_ADDRESS,
  rpcUrls,
  multicallAddress,
  COHORT_REGISTRYS,
  MAGIC_VALUES,
} = require("../constants");
const { getUserMints } = require("./graphNfts");
const { isEmpty, concat, subtract } = require("lodash");
// const { StakeV2 } = require("../typings");
const { aggregate } = require("@makerdao/multicall");

const roundValue = (value, roundTo) => {
  return Math.floor(value * 10 ** roundTo) / 10 ** roundTo;
};

const computeCohortSalt = (cohortId, fid) => {
  return ethers.utils.defaultAbiCoder
    .encode(["address", "uint256"], [cohortId, fid])
    .slice(0, 66);
};

const createCalls = (target, methodName, args, returns) => {
  if (!target) throw Error("Target undefined");
  return {
    target,
    call: [methodName, ...args],
    returns,
  };
};

const formatUserStakings = (
  /** call results */
  callResults,
  /** cohortId */
  cohortId,
  /** token id */
  tokenId,
  /** timestamp */
  timestamp
) => {
  // farmId
  let fid = callResults[String(tokenId).concat("_").concat("fid")];
  return {
    farmId: `${cohortId}-0x${fid}`,
    fid,
    nftTokenId: parseInt(tokenId),
    stakedAmount:
      callResults[String(tokenId).concat("_").concat("stakedAmount")],
    startBlock:
      callResults[String(tokenId).concat("_").concat("startBlock")].toNumber(),
    endBlock:
      callResults[String(tokenId).concat("_").concat("endBlock")].toNumber(),
    hasBoosterBuyed:
      callResults[String(tokenId).concat("_").concat("isBooster")],
    stakedOn: timestamp,
  };
};

const fetchUserNFts = async (chainId, nftId) => {
  // nft manager
  let nftManager = NFT_MANAGER_ADDRESS[chainId];

  if (!chainId) return null;
  // taking both side tranfers

  const nfts = await getUserMints(chainId, nftId);

  // create calls for grabing cohort addresses
  let nftStakingDetails = [];
  let calls = [];

  calls.push(
    createCalls(
      nftManager,
      "tokenIdToCohortId(uint256)(address)",
      [Number(nftId)],
      [[`${nfts[0].tokenId}`, (val) => val]]
    )
  );

  if (!isEmpty(calls)) {
    let tokenIdToCohortIdCallResults = await multicall(chainId, calls);
    let original = tokenIdToCohortIdCallResults.results.original;

    // push all the staking calls into this
    let stakeCalls = [];

    // create calls for stakings
    for (var k = 0; k < nfts.length; k++) {
      const { tokenId } = nfts[k];
      const cohort = original[tokenId];
      stakeCalls.push(
        createCalls(
          cohort,
          "viewStakingDetails(uint256)(uint32,uint256,uint256,uint256,uint256,address,address,bool)",
          [tokenId],
          [
            [String(tokenId.concat("_")).concat("fid")],
            [String(tokenId.concat("_")).concat("nftTokenId")],
            [String(tokenId.concat("_")).concat("stakedAmount")],
            [String(tokenId.concat("_")).concat("startBlock")],
            [String(tokenId.concat("_")).concat("endBlock")],
            [String(tokenId.concat("_")).concat("originalOwner")],
            [String(tokenId.concat("_")).concat("referralAddress")],
            [String(tokenId.concat("_")).concat("isBooster")],
          ]
        )
      );
    }
    // grab stakes
    let stakes = await multicall(chainId, stakeCalls);
    let originalStakesCallResult = stakes.results.original;

    // deriving stakings
    // let stakings = [];
    for (var m = 0; m < nfts.length; m++) {
      let { tokenId, timestamp } = nfts[m];
      const cohort = original[tokenId];
      let stake = formatUserStakings(
        originalStakesCallResult,
        cohort,
        tokenId,
        parseInt(timestamp)
      );
      nftStakingDetails.push(stake);
    }
  }

  return nftStakingDetails;
};

const multicall = async (chainId, calls) => {
  const results = await aggregate(calls, {
    rpcUrl: rpcUrls[chainId],
    multicallAddress: multicallAddress[chainId],
  });
  return results;
};

const createCallsForFarmData = (farms, chainId) => {
  // collect calls
  let calls = [];

  for (var k = 0; k < farms.length; k++) {
    let { cohort, token, farmData, farmDetails } = farms[k];
    if (farmData !== undefined || farmDetails === undefined) {
      break;
    }
    let { startBlock, endBlock, epochBlocks } = cohort || {};

    console.log("farmId", token.fid);

    if (isEmpty(farmData)) {
      // create calls for total staking
      calls.push(
        createCalls(
          cohort.id,
          "totalStaking(uint32)(uint256)",
          [token.fid.toString()],
          [[concat(`TOTALSTAKING`, token.id)]]
        )
      );
      // create calls for prior epoch tvls
      let endCheckpoint = roundValue(
        subtract(endBlock, startBlock) / epochBlocks,
        0
      );

      // create calls for priorEpochATVL
      let i = 0;
      while (i < endCheckpoint) {
        calls.push(
          createCalls(
            cohort.id,
            "priorEpochATVL(uint32,uint256)(uint256)",
            [Number(token.fid), Number(i)],
            [[concat(`PRIOR_EPOCH_ATVL`, token.fid.toString(), i.toString())]]
          )
        );
        i++;
      }

      // create calls for whole cohort lock
      calls.push(
        createCalls(
          COHORT_REGISTRYS[chainId],
          "wholeCohortLock(address)(bool)",
          [cohort.id],
          [[concat(`WHOLE_COHORT_LOCK`, cohort.id)]]
        )
      );

      // create calls for token lock status
      let m = 0;
      let salt = computeCohortSalt(cohort.id, token.fid);
      while (m < MAGIC_VALUES.length) {
        // create calls for locked cohort status if there any action which has been paused
        calls.push(
          createCalls(
            COHORT_REGISTRYS[chainId],
            "lockCohort(address,bytes4)(bool)",
            [cohort.id, MAGIC_VALUES[m]],
            [[concat(`LOCK_COHORT_`, cohort.id, MAGIC_VALUES[m])]]
          )
        );

        // create calls for token lock status
        calls.push(
          createCalls(
            COHORT_REGISTRYS[chainId],
            "tokenLockedStatus(bytes32,bytes4)(bool)",
            [salt, MAGIC_VALUES[m]],
            [[concat(`TOKEN_LOCK_STATUS`, salt, MAGIC_VALUES[m])]]
          )
        );
        m++;
      }
    }
  }

  return calls;
};

module.exports = {
  createCalls,
  fetchUserNFts,
  multicall,
  createCallsForFarmData,
  formatUserStakings,
};
