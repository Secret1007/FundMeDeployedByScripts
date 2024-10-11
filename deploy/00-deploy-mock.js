const { DECIMAL, INITIAL_ANSWER, developmentChains } = require("../helper-hardhat-config.js")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = (await getNamedAccounts())
  const { deploy, log } = deployments
  if (developmentChains.includes(network.name)) {
    await deploy("MockV3Aggregator", {
      from: firstAccount,
      args: [DECIMAL, INITIAL_ANSWER],
      log: true
    })
  } else {
    log("Skipping deploy mock...")
  }
}

module.exports.tags = ["all", "mock"]