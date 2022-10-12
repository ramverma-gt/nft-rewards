const { ApolloClient } = require('apollo-client')
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;
const fetch = require('cross-fetch/polyfill').fetch;
const createHttpLink = require('apollo-link-http').createHttpLink;

const endpoints = {
  1: "https://api.thegraph.com/subgraphs/name/themohitmadan/unifarm-eth",
  56: "https://api.thegraph.com/subgraphs/name/themohitmadan/unifarm-bsc",
  137: "https://api.thegraph.com/subgraphs/name/themohitmadan/unifarm-polygon",
  43114: "",
};

const getYF2GraphqlClient = (
  chainId
) => {
  const endpoint = endpoints[chainId];
  if (!endpoint) return null;
  return new ApolloClient({
    link: createHttpLink({
      uri: endpoint,
      fetch: fetch
    }),
    cache: new InMemoryCache(),
  });
};

module.exports = {
  getYF2GraphqlClient
}
