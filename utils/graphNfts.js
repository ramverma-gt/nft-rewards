const { v2Transfer, v2FarmQuery, v2Claims } = require("../graph/queries");
// import { Transfer } from "../graph/typings";
const { getYF2GraphqlClient } = require("../graph");
// import { NFT_MANAGER_ADDRESS } from "../constants";

const getUserMints = async (chainId, tokenId) => {
  // if (!user) return null;
  const client = getYF2GraphqlClient(chainId);
  if (!client) return null;
  const results = await client.query({
    query: v2Transfer,
    variables: {
      where: {
        tokenId,
      },
      first: 1000,
    },
  });
  return results.data.transfers;
};

const getYF2FarmDetails = async (chainId) => {
  const client = getYF2GraphqlClient(chainId);
  if (!client) return null;
  const response = await client.query({
    query: v2FarmQuery,
  });

  if (response.data) {
    const responseWithChainId = response.data.tokens.map((item) => {
      return {
        ...item,
        chainId,
      };
    });

    return responseWithChainId;
  }
};

const getUserClaims = async (chainId, tokenId) => {
  if (!tokenId) return null;
  const client = getYF2GraphqlClient(chainId);
  const results = await client.query({
    query: v2Claims,
    variables: {
      where: {
        tokenId,
      },
      first: 1000,
    },
  });

  return results.data.claimHistories;
};

module.exports = { getUserMints, getUserClaims, getYF2FarmDetails };
