const { isEmpty, divide, sum, multiply, subtract, add } = require("lodash");

const getV2Rewards = (options) => {
  // if (isEmpty(options)) return null;
  // destruct all properties
  let {
    rewards,
    pbr,
    epochBlocks,
    userStakedBlock,
    startCheckpoint,
    currentCheckpoint,
    stakedAmount,
    totalStakeLimit,
    priorCheckpointTVLs,
    deriveBothAPY,
    isBoosted,
    totalStaking,
    cohortVersion,
  } = options || {};

  // if (isEmpty(priorCheckpointTVLs)) return null;
  // validate
  // if (rewards.length !== pbr.length) return null;

  let rewardsTokenMetaData = [];
  // start checkpoint
  let k = startCheckpoint;

  // push all the r values
  let rValues = [];
  let rRvalues = [];

  // when its premature we need to fetch both rewards
  // when its after staking we need to fetch only single way either a staking will boosted or not

  // calculate aggregated reward value
  if (currentCheckpoint !== startCheckpoint) {
    while (k < currentCheckpoint) {
      let eligibleBlocks = epochBlocks;
      const nextCheckpointBlocks = multiply(
        add(startCheckpoint, 1),
        epochBlocks
      );

      console.log(
        "userStakedBlock",
        userStakedBlock,
        "nextCheckpointBlocks",
        nextCheckpointBlocks
      );

      if (userStakedBlock > startCheckpoint * epochBlocks) {
        eligibleBlocks = subtract(nextCheckpointBlocks, userStakedBlock);
      }

      // check if using both
      let tStaking = totalStaking === 0 ? stakedAmount : totalStaking;
      // let tStaking = totalStaking;
      let priorATvl =
        priorCheckpointTVLs[k] === 0 ? tStaking : priorCheckpointTVLs[k];

      // if (deriveBothAPY) {
      //   rValues.push(
      //     divide(multiply(stakedAmount, eligibleBlocks), totalStakeLimit)
      //   );
      //   rRvalues.push(
      //     divide(multiply(stakedAmount, eligibleBlocks), priorATvl)
      //   );
      // } else {
      // this is single side
      if (isBoosted) {
        rRvalues.push(
          divide(
            multiply(stakedAmount, eligibleBlocks),
            // totalStaking
            priorATvl
          )
        );
      } else {
        rValues.push(
          divide(multiply(stakedAmount, eligibleBlocks), totalStakeLimit)
        );
      }
      // }

      k++;
    }
  }

  let rValue = sum(rValues);
  let rRvalue = sum(rRvalues);

  if (currentCheckpoint === startCheckpoint) {
    rValue = 0;
  }

  // sum up the reward token
  let usdAmounts = [];
  let boostedUsdAmounts = [];

  for (var t = 0; t < rewards.length; t++) {
    // reward for non boosted staking
    let rAmount = multiply(rValue, pbr[t]);
    // reward for boosted staking
    let rRAmount = multiply(rRvalue, pbr[t]);

    // push all the reward token meta data
    let token = rewards[t];
    rewardsTokenMetaData.push({
      ...token,
      rewardValue: isBoosted ? rRAmount * 0.95 : rAmount * 0.95,
    });

    // calculate usd amounts
    usdAmounts.push(multiply(rAmount, token?.pricePoints[cohortVersion]));
    boostedUsdAmounts.push(
      multiply(rRAmount, token?.pricePoints[cohortVersion])
    );
  }

  return {
    rewardsTokenMetaData,
    totalEarnedValueInUsd: isBoosted ? sum(boostedUsdAmounts) : sum(usdAmounts),
  };
};

module.exports = {
  getV2Rewards,
};
