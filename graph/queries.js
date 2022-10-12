const gql = require("graphql-tag");

const v2Transfer = gql`
  query Transfers($where: Transfer_filter, $first: Int) {
    transfers(where: $where, first: $first) {
      id
      from
      to
      tokenId
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

const v2FarmQuery = gql`
  query Tokens {
    tokens {
      id
      cohort {
        id
        protocolConfig {
          feeAmount
          referralPercentage
        }
        cohortVersion
        startBlock
        endBlock
        epochBlocks
        hasLiquidityMining
        hasContainsWrappedToken
        hasCohortLockinAvaliable
        rewards
        boosters {
          bpid
          boosterPackAmount
          paymentToken
        }
        deployedAt
      }
      fid
      farmToken
      userMinStake
      userMaxStake
      totalStakeLimit
      decimals
      skip
    }
  }
`;

const v2Claims = gql`
  query ClaimHistories($where: ClaimHistory_filter) {
    claimHistories(where: $where) {
      id
      user
      tokenId
      rValue
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

module.exports = {
  v2Transfer,
  v2FarmQuery,
  v2Claims,
};
