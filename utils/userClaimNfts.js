const { getUserClaims } = require("./graphNfts");
const { BigNumber } = require("ethers");
const { isEmpty } = require("lodash");
const { fetchV2Farms } = require("./farm");
const { fetchUserNfts } = require("./multicall");

const fetchUserClaims = async (chainId, nftId) => {
  if (nftId) {
    // do some thing for claims
    let userClaims = await getUserClaims(chainId, nftId);

    let claims = [];
    if (!isEmpty(userClaims)) {
      for (let k = 0; k < userClaims.length; k++) {
        let { tokenId, rValue, blockNumber, transactionHash, timestamp } =
          userClaims[k];
        claims.push({
          tokenId: parseInt(tokenId),
          rValue: BigNumber.from(rValue),
          blockNumber: parseInt(blockNumber),
          transactionHash,
          timeStamp: parseInt(timestamp),
        });
      }
    }

    return claims;
  }
};

// const fetchClaimData = async (nfts, farms) => {
//   // mints
//   let mints = nfts.mintData;

//   console.log("mints", mints);

//   let claimData = nfts;
//   // derive only active stakes
//   let claimedStakes = () => {
//     return mints?.filter((e) => {
//       return e.endBlock > 0;
//     });
//   };

//   let userNFts = [];

//   for (let k = 0; k < claimedStakes?.length; k++) {
//     let stake = claimedStakes[k];
//     //console.log('stake', stake);
//     let claims = claimData?.filter((e) => e.tokenId === stake?.nftTokenId);
//     // staked farm
//     let stakedFarm = farms?.filter((e) => {
//       return e.token.id.toLowerCase() === stake.farmId.toLowerCase();
//     });

//     if (!isEmpty(stakedFarm)) {
//       let farm = stakedFarm[0];

//       let { farmDetails, cohort } = farm;
//       // get claimed rewards
//       let combinedRValue = claims?.map((claim) => claim.rValue);

//       let claimedRewards = getClaimedRewards(
//         farmDetails.rewards,
//         farmDetails.perBlockRewards,
//         combinedRValue,
//         cohort?.cohortVersion
//       );

//       // user nfts
//       userNFts.push({
//         farm,
//         claims,
//         stake,
//         earnedRewards: claimedRewards,
//       });
//     }
//   }
//   return userNFts;
// };

// module.exports = {
//   fetchUserClaims,
//   fetchClaimData,
// };
