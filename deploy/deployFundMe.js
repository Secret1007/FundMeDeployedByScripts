const { ethers } = require("hardhat")

async function main() {
  const fundMeFactory = await ethers.getContractFactory("FundMe")
  console.log("Deploying FundMe contract...")
  const fundMe = await fundMeFactory.deploy(100)
  await fundMe.waitForDeployment()
  console.log(`FundMe deployed to: ${fundMe.target}`)
  if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    // verify fundme
    await fundMe.deploymentTransaction().wait(6)
    console.log("waiting for 6 confirmations...")
    await verifyFundMe(fundMe.target, [100])
  } else {
    console.log("no need to verify")
  }
}

async function verifyFundMe(fundMeAddr, args) {
  await hre.run("verify:verify", {
    address: fundMeAddr,
    constructorArguments: args,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })