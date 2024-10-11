const { network } = require("hardhat")
const { developmentChains, LOCK_TIME, networkConfig, CONFIRMATIONS } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = (await getNamedAccounts())
  console.log("firstAccount", firstAccount)
  const { deploy, log } = deployments

  let dataFeedAddr
  let confirmations
  if (developmentChains.includes(network.name)) {
    const MockV3Aggregator = await deployments.get("MockV3Aggregator")
    dataFeedAddr = MockV3Aggregator.address
    confirmations = 0

    console.log("MockV3Aggregator deployed at", MockV3Aggregator.address)
  } else {
    dataFeedAddr = networkConfig[network.config.chainId].ethUsdPriceFeed
    confirmations = CONFIRMATIONS
  }

  console.log("LOCK_TIME, dataFeedAddr:", LOCK_TIME, dataFeedAddr)
  const fundMe = await deploy("FundMe", {
    from: firstAccount,
    args: [LOCK_TIME, dataFeedAddr],
    log: true,
    waitConfirmations: confirmations
  })


  if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying...")
    await hre.run("verify:verify", {
      address: fundMe.address,
      constructorArguments: [LOCK_TIME, dataFeedAddr],
    })
  } else {
    console.log("Skipping verify...")
  }
  log(`FundMe deployed at ${fundMe.address}`)
}

module.exports.tags = ["all", "fundme"]