const DECIMAL = 8
const INITIAL_ANSWER = 300000000000
const LOCK_TIME = 180
const CONFIRMATIONS = 5

const developmentChains = ["hardhat", "local"]

const networkConfig = {
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  }
}

module.exports = {
  DECIMAL,
  CONFIRMATIONS,
  INITIAL_ANSWER,
  LOCK_TIME,
  developmentChains,
  networkConfig
}