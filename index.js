const express = require( "express");
const { json, urlencoded } = require( "body-parser");
const morgon = require( "morgan");
const cors = require("cors");
const chalk = require("chalk");
const helmet = require("helmet");
const { config } = require("dotenv");
const { isEmpty } = require("lodash");
const NodeCache = require("node-cache");
const { getNftOwner, fetchRewardForNft } = require("./utils");

config({ path: ".env" });

const app = express();
let log = console.log;

const MyCache = new NodeCache({ stdTTL: 4800, checkperiod: 4800 });

app.use(json({ limit: "50kb" }));
app.use(urlencoded({ extended: true }));

app.use(
  morgon((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);

app.use(
  cors({
    origin: "*",
  })
);

app.use(helmet());

// application main route
// calculate TVL for all chain
app.get("/reward", async (req, res) => {
  let chainId = req.query.chainId;
  let nftId = req.query.nftId;

  try {
    const owner = await fetchRewardForNft(chainId, nftId);
    return res.status(200).json({
      code: 200,
      message: "NFT rewards fetched successfully",
      data: owner
    })
  } catch (err) {
    if (err instanceof Error) {
      log(chalk.red(`AppError: ${err.message}`));
      return res.status(500).json({
        code: 500,
        message: `AppError: ${err.message}`,
        data: {},
      });
    }
  }
});

app.use(function (req, res, next) {
  res.status(400).json({
    code: 400,
    message: "no route found.",
  });
});

app.listen(process.env.PORT, () => {
  log(chalk.blue(`reward server started at ${process.env.PORT} port.`));
});
