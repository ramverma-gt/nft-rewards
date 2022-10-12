const axios = require("axios");

// v2 tokenlist
const tokenlistV2 = {
  1: {
    tokens: 'https://raw.githubusercontent.com/ramverma-oro/v2-tokenlist/mainnet/ethereum/tokenlist.json',
    lpTokens: 'https://raw.githubusercontent.com/ramverma-oro/v2-tokenlist/mainnet/ethereum/tokenlist-lp.json',
  },
  56: {
    tokens: 'https://raw.githubusercontent.com/ramverma-oro/v2-tokenlist/mainnet/bsc/tokenlist.json',
    lpTokens: 'https://raw.githubusercontent.com/ramverma-oro/v2-tokenlist/mainnet/bsc/tokenlist-lp.json',
  },
  137: {
    tokens: 'https://raw.githubusercontent.com/ramverma-oro/v2-tokenlist/mainnet/polygon/tokenlist.json',
    lpTokens: 'https://raw.githubusercontent.com/ramverma-oro/v2-tokenlist/mainnet/polygon/tokenlist-lp.json',
  },
};

const fetchV2TokenList = async () => {
  try {
    // tokenlist v2 chains
    let tokenlistV2Chains = Object.keys(tokenlistV2);
    let axiosRequestUrls = [];
    for (let n = 0; n < tokenlistV2Chains.length; n++) {
      let networkId = parseInt(tokenlistV2Chains[n]);
      let url = Object.values(tokenlistV2[networkId]).map((tokenlist) => axios.get(tokenlist));
      axiosRequestUrls.push(url[0]);
      axiosRequestUrls.push(url[1]);
    }

    const results = (await axios.all(axiosRequestUrls));
    let tokenlistv2 = {};
    let tokenlistV2Lp = {};
    let zero = 0;
    // we opened the chain Id array
    for (let t = 0; t < results.length; t++) {
      // if even
      let networkId = parseInt(results[t]?.data?.networkId);
      let isEven = t % 2 == zero;
      if (isEven) {
        // store the token list
        tokenlistv2[networkId] = results[t]?.data?.tokens;
      } else {
        tokenlistV2Lp[networkId] = results[t]?.data?.tokenlist;
      }
    }

    let tokenlist = {};

    for (let j = 0; j < tokenlistV2Chains.length; j++) {
      let networkId = parseInt(tokenlistV2Chains[j]);
      tokenlist[networkId] = {
        tokens: tokenlistv2[networkId],
        lpTokens: tokenlistV2Lp[networkId],
      };
    }

    // return the lp tokenlist
    return tokenlist;
  } catch (err) {
    // facing errors
    console.log('fetchLpTokenList:', err.message);
    return;
  }
};

module.exports = {
  fetchV2TokenList
}