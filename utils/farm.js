const { fetchV2TokenList } = require("./tokenList");
const {
  isEmpty,
  concat,
  subtract,
  multiply,
  add,
  sum,
  divide,
  orderBy,
} = require("lodash");
const { getYF2FarmDetails } = require("./graphNfts");
const { BigNumber, ethers } = require("ethers");
const { MAGIC_VALUES, BLOCK_TIME, YEAR } = require("../constants");

const log = console.log;

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

const roundValue = (value, roundTo) => {
  return Math.floor(value * 10 ** roundTo) / 10 ** roundTo;
};

const getV2Apy = (
  /** earned reward value in USD */
  earnedRewardValueInUsd,
  /** stake Amount in USD */
  stakeAmountInUsd,
  /** evaluation days - for how many days ??  */
  evaluationDays
) => {
  if (evaluationDays === 0) return 0;
  // fractional days
  let fractionalDays = YEAR / evaluationDays;
  // apy calculation
  return multiply(
    multiply(divide(earnedRewardValueInUsd, stakeAmountInUsd), fractionalDays),
    100
  );
};

const computeCohortSalt = (cohortId, fid) => {
  return ethers.utils.defaultAbiCoder
    .encode(["address", "uint256"], [cohortId, fid])
    .slice(0, 66);
};

const unitFormatter = (units, decimals = 18) => {
  if (!units) return null;
  return Number(ethers.utils.formatUnits(units, decimals ? decimals : 18));
};

const decodeRewardTokens = (
  /** reward bytes */
  rewards
) => {
  return ethers.utils.defaultAbiCoder.decode(
    ["address[]", "uint256[]"],
    rewards
  );
};

const getRewardTokensMetaData = (
  /** tokenlist basically tokens meta data */
  tokenlist,
  /** reward token addresses */
  rewards,
  /** pbrs - per block rewards */
  pbrs
) => {
  // empty arrays
  let rewardTokens = [];
  let parsedPbrs = [];

  for (var q = 0; q < rewards.length; q++) {
    const filterTokens = tokenlist?.filter((e) => {
      return e.address.toLowerCase() === rewards[q].toLowerCase();
    });
    rewardTokens.push(filterTokens?.[0]);
    parsedPbrs.push(unitFormatter(pbrs[q], filterTokens?.[0]?.decimals));
  }

  return [rewardTokens, parsedPbrs];
};

const formatFarmDetails = (
  /** farm token address */
  farmToken,
  /** tokenlist */
  tokenlist,
  /** rewards */
  rewards,
  /** is boosters availbale */
  isBoosterAvailable,
  /** has liquidity mining */
  hasLiquidityMining,
  /** cohort version */
  cohortVersion,
  /** chain Id */
  chainId
) => {
  let farmName;
  let farmSymbol;
  let farmIcon;
  let farmTokenPrice;
  let token0;
  let token1;

  // derive tokens
  let { tokens, lpTokens } = tokenlist || {};

  let dexAddLiquidityPage = "";
  if (hasLiquidityMining) {
    // farm token details
    let farmTokenDetails = lpTokens?.filter(
      (e) => e.lpToken.toLowerCase() === farmToken.toLowerCase()
    );
    if (!isEmpty(farmTokenDetails)) {
      let farmTokenMetaData = farmTokenDetails[0];
      let liquidityPoolTokens = farmTokenMetaData.tokens;
      let lpTokenMetaData = liquidityPoolTokens?.map((liquidityPoolToken) => {
        let lpToken = tokens?.filter(
          (e) => e.address.toLowerCase() === liquidityPoolToken.toLowerCase()
        );
        if (!isEmpty(lpToken)) {
          return lpToken[0];
        }
      });

      farmName = `${lpTokenMetaData?.[0]?.symbol}-${lpTokenMetaData?.[1]?.symbol}`;
      farmSymbol = farmName;
      farmIcon = lpTokenMetaData?.map((token) => token?.icon);
      farmTokenPrice = farmTokenMetaData?.pricePoints?.[cohortVersion];
      dexAddLiquidityPage = farmTokenDetails?.[0]?.dexAddLiquidityPage;
      // two additional fields
      token0 = lpTokenMetaData?.[0];
      token1 = lpTokenMetaData?.[1];
    }
  } // for normal one
  else {
    let farmTokenDetails = tokens?.filter(
      (e) => e.address.toLowerCase() === farmToken.toLowerCase()
    );
    let { name, icon, symbol, pricePoints } = farmTokenDetails?.[0] || {};
    farmName = name;
    farmSymbol = symbol;
    farmIcon = [icon];
    farmTokenPrice = pricePoints?.[cohortVersion];
  }

  // decode reward tokens
  let [rewardTokenAddress, pbrs] = decodeRewardTokens(rewards);

  let [rewardTokensMetaData, parsedPbrs] = getRewardTokensMetaData(
    tokens,
    rewardTokenAddress,
    pbrs
  );

  return {
    farmName,
    farmSymbol,
    farmIcon,
    farmTokenPrice,
    rewards: rewardTokensMetaData,
    rewardTokenAddress,
    perBlockRewards: parsedPbrs,
    isBoosterAvailable,
    chainId,
    token0,
    token1,
    dexAddLiquidityPage,
  };
};

const formatProtocolConfig = (protocolConfig) => {
  if (isEmpty(protocolConfig)) return null;
  return {
    ...protocolConfig,
    refPercentage: parseFloat(protocolConfig.referralPercentage),
  };
};

const formatBoosters = (boosters) => {
  if (isEmpty(boosters)) return null;
  return boosters.map((items) => {
    return {
      id: items.id,
      bpid: parseFloat(items.bpid),
      paymentToken: items.paymentToken,
      boosterPackAmount: BigNumber.from(items.boosterPackAmount),
      numberOfBoostedUser: parseFloat(items.numberOfBoostedUser),
      boosterSell: items.boosterSell,
    };
  });
};

const formatCohortDetails = (cohort) => {
  if (isEmpty(cohort)) return null;
  return {
    id: cohort.id,
    protocolConfig: formatProtocolConfig(cohort.protocolConfig),
    cohortVersion: cohort.cohortVersion,
    startBlock: parseFloat(cohort.startBlock),
    endBlock: parseFloat(cohort.endBlock),
    epochBlocks: parseFloat(cohort.epochBlocks),
    hasLiquidityMining: cohort.hasLiquidityMining,
    hasContainsWrappedToken: cohort.hasContainsWrappedToken,
    hasCohortLockinAvaliable: cohort.hasCohortLockinAvaliable,
    numberOfFarms: parseFloat(cohort.numberOfFarms),
    numberOfBoostedUsers: parseFloat(cohort.numberOfBoostedUsers),
    rewards: cohort.rewards,
    boosters: formatBoosters(cohort.boosters),
    deployedAt: parseFloat(cohort.deployedAt),
  };
};

const formatFarmTokenMetaDataDetails = (token) => {
  if (isEmpty(token)) return null;
  const decimals = parseFloat(token.decimals);
  return {
    id: token.id,
    fid: parseFloat(token.fid),
    farmToken: token.farmToken,
    userMinStake: unitFormatter(token.userMinStake, decimals),
    userMaxStake: unitFormatter(token.userMaxStake, decimals),
    totalStakeLimit: unitFormatter(token.totalStakeLimit, decimals),
    decimals: decimals.toString(),
    skip: token.skip,
  };
};

const formatFarmTokenDetails = (token) => {
  if (isEmpty(token)) return null;
  return {
    cohort: formatCohortDetails(token.cohort),
    token: formatFarmTokenMetaDataDetails(token),
  };
};

const fetchV2Farms = async (chainId, nftId) => {
  const tokenlist = await fetchV2TokenList();

  // only ethereum chain supported
  let farmPublicData = [];
  try {
    const allFarms = await getYF2FarmDetails(chainId);

    const filteredFarms = allFarms.filter(
      (farm) => String(farm.id).toLowerCase() === String(nftId).toLowerCase()
    );

    // update boosters
    if (!isEmpty(filteredFarms)) {
      for (var k = 0; k < filteredFarms.length; k++) {
        let farmItems = filteredFarms[k];
        let farm = formatFarmTokenDetails(farmItems);
        let { cohort, token } = farm;
        let boosters = [];

        // check if boosters available in that cohort
        if (!isEmpty(cohort?.boosters)) {
          // update the booster object
          let t = 0;
          while (t < cohort.boosters.length) {
            // filtereing token in tokenlist
            let { paymentToken, boosterPackAmount } = cohort.boosters[t];
            let boosterToken = tokenlist[farmItems?.chainId]?.tokens?.filter(
              (e) => e.address.toLowerCase() === paymentToken.toLowerCase()
            )?.[0];
            if (!isEmpty(boosterToken)) {
              // then update this
              boosters.push({
                ...cohort.boosters[t],
                formattedBoosterAmount: unitFormatter(
                  boosterPackAmount,
                  boosterToken?.decimals
                ),
                name: boosterToken?.symbol,
                decimals: boosterToken?.decimals,
                icon: boosterToken?.icon,
              });
            }
            t++;
          }
        }

        cohort.boosters = boosters;

        // collect farmDetails data as well
        let { farmToken } = token;

        // format farm token
        let farmDetails = formatFarmDetails(
          farmToken,
          tokenlist[farmItems?.chainId],
          cohort.rewards,
          !isEmpty(cohort?.boosters),
          cohort?.hasLiquidityMining,
          cohort?.cohortVersion,
          farmItems?.chainId
        );

        // after update push the farm
        farmPublicData.push({ ...farm, farmDetails });
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      log(`V2 Farms derivation failed`, err.stack);
    }
  }

  return farmPublicData;
};

const getTotalStakingUsd = (
  /** farm total staking  */
  totalStaking,
  /** farm token price */
  farmTokenPrice
) => {
  return multiply(totalStaking, farmTokenPrice);
};

const computeApy = (
  /** list of rewards */
  rewards,
  /** per block rewards */
  pbrs,
  /** number of blocks */
  nBlocks,
  /** stake limit in USD */
  stakeLimitInUSD,
  /** active staking in USD */
  activeStakingInUSD,
  /** Block Time */
  blockTime,
  /** cohortVersion */
  cohortVersion
) => {
  // reward values to store reward IN USD
  let rewardsValue = [];
  // loop the rewards
  for (let k = 0; k < rewards.length; k++) {
    let { pricePoints } = rewards[k] || {};
    let earningReward = pbrs[k] * nBlocks;
    let earningRewardInUSD = earningReward * pricePoints?.[cohortVersion];
    rewardsValue.push(earningRewardInUSD);
  }

  let totalReward = sum(rewardsValue);
  // compute evaluation days
  let evaluationDays = (nBlocks * blockTime) / 86400;
  // apy computation

  let apy = getV2Apy(totalReward, stakeLimitInUSD, evaluationDays);
  let boostedAPY = getV2Apy(totalReward, activeStakingInUSD, evaluationDays);

  // cap to the 400%
  if (activeStakingInUSD === 0) {
    boostedAPY = 400;
  }

  // booster apy limiter;
  if (boostedAPY > 400) {
    boostedAPY = 400;
  }
  // returns the apy and computed total reward in USD
  return {
    apy,
    boostedAPY,
    earningRewardInUSD: totalReward,
  };
};

const getPoolFilled = (
  /** farm active staking */
  activeStaking,
  /** farm total stake limit */
  farmTotalStakeLimit
) => {
  return roundValue(multiply(activeStaking / farmTotalStakeLimit, 100), 2);
};

const formatFarmData = (
  /** farm data */
  farms,
  /** block number when fetched */
  blockNumber,
  /** call results */
  callResults,
  /** chain Id */
  chainId
) => {
  // push all the required data into this
  let farmsData = [];

  // iterate loop here
  for (var k = 0; k < farms.length; k++) {
    let { token, cohort, farmDetails } = farms[k];

    let { endBlock, startBlock, epochBlocks, id, deployedAt } = cohort;
    let { fid, decimals, totalStakeLimit } = token;

    let decimal = parseInt(decimals);
    // format data
    let activeStaking = callResults[concat(`TOTALSTAKING`, token.id)];
    let farmActiveStaking = unitFormatter(activeStaking, decimal);

    let priorEpochTvls = [];

    let endCheckpoint = roundValue(
      subtract(endBlock, startBlock) / epochBlocks,
      0
    );
    let p = 0;

    // loop though checkpoints
    while (p < endCheckpoint) {
      let priorEpochATVL =
        callResults[concat(`PRIOR_EPOCH_ATVL`, fid.toString(), p.toString())];
      priorEpochTvls.push(unitFormatter(priorEpochATVL, decimal));
      p++;
    }

    const salt = computeCohortSalt(id, fid);
    let [STAKE_MAGIC_VALUE, UNSTAKE_MAGIC_VALUE] = MAGIC_VALUES;

    // i know this is very core
    // for stake lock
    let wholeCohortLock = callResults[concat(`WHOLE_COHORT_LOCK`, cohort.id)];
    let stakeLockStatus =
      callResults[concat(`LOCK_COHORT_`, cohort.id, STAKE_MAGIC_VALUE)];
    let tokenStakeLockStatus =
      callResults[concat(`TOKEN_LOCK_STATUS`, salt, STAKE_MAGIC_VALUE)];

    // unstake lock
    let unStakeLockStatus =
      callResults[concat(`LOCK_COHORT_`, cohort.id, UNSTAKE_MAGIC_VALUE)];
    let tokenUnStakeLockStatus =
      callResults[concat(`TOKEN_LOCK_STATUS`, salt, UNSTAKE_MAGIC_VALUE)];

    // caluclate farm end time
    let farmEndTime = getFarmEndTime(deployedAt, endBlock, startBlock, chainId);
    let blockDifference = getBlockDiffrence(
      cohort?.endBlock,
      cohort?.startBlock
    );
    let pbrs = farmDetails?.perBlockRewards;

    let farmTokenPrice = farmDetails.farmTokenPrice;
    let stakeLimitInUSD = token?.totalStakeLimit * farmTokenPrice;

    // active total staking
    let usdTotalStaking = getTotalStakingUsd(farmActiveStaking, farmTokenPrice);

    // reward
    let reward = computeApy(
      farmDetails?.rewards,
      pbrs,
      blockDifference,
      stakeLimitInUSD,
      usdTotalStaking,
      BLOCK_TIME[chainId],
      cohort?.cohortVersion
    );

    farmsData.push({
      farmData: {
        farmId: token?.id,
        activeStaking: farmActiveStaking,
        priorEpochTvls,
        usdTotalStaking,
        poolFilled: getPoolFilled(farmActiveStaking, totalStakeLimit),
        isHotFarm: undefined,
        farmEndTime,
        isFarmEnds: blockNumber > endBlock,
        hasStakeLocked:
          wholeCohortLock || stakeLockStatus || tokenStakeLockStatus,
        hasUnstakeLocked:
          wholeCohortLock || unStakeLockStatus || tokenUnStakeLockStatus,
        fetchedAtBlockNumber: blockNumber,
        apy: roundValue(reward?.apy, 2),
        boostUptoAPY: roundValue(reward?.boostedAPY, 2),
        hasLiquidityMiningAvailable: cohort?.hasLiquidityMining,
      },
    });
  }

  let yieldFarmsOnly = farmsData?.filter(
    (e) => e.farmData.hasLiquidityMiningAvailable === false
  );
  let lpFarmsOnly = farmsData?.filter(
    (e) => e.farmData.hasLiquidityMiningAvailable === true
  );

  // for yield farms
  let top3TvlYieldFarms = orderBy(
    yieldFarmsOnly,
    ["farmData.poolFilled"],
    ["desc"]
  );
  let top3MostYieldApyFarms = orderBy(
    yieldFarmsOnly,
    ["farmData.apy"],
    ["desc"]
  )?.slice(0, 3);

  top3TvlYieldFarms = top3TvlYieldFarms
    ?.filter((e) => e.farmData.poolFilled > 60)
    ?.slice(0, 3);

  // for lp farms
  let top3TvlLiquidityFarms = orderBy(
    lpFarmsOnly,
    ["farmData.poolFilled"],
    ["desc"]
  );
  let top3MostLiquidityApyFarms = orderBy(
    lpFarmsOnly,
    ["farmData.apy"],
    ["desc"]
  )?.slice(0, 3);
  top3TvlLiquidityFarms = top3TvlLiquidityFarms
    ?.filter((e) => e.farmData.poolFilled > 60)
    ?.slice(0, 3);

  let hotFarms = top3TvlYieldFarms
    ?.concat(top3MostYieldApyFarms)
    ?.concat(top3TvlLiquidityFarms)
    ?.concat(top3MostLiquidityApyFarms);

  return farmsData?.map(({ farmData }) => {
    // filter hot farm by farm end time
    let { farmId } = farmData;
    // hot farm
    let isHotFarm = hotFarms?.filter(
      (e) => e.farmData.farmId.toLowerCase() === farmId.toLowerCase()
    );

    return {
      farmData: {
        ...farmData,
        isHotFarm: !isEmpty(isHotFarm) ? true : false,
      },
    };
  });
};

module.exports = {
  fetchV2Farms,
  unitFormatter,
  formatFarmData,
};
