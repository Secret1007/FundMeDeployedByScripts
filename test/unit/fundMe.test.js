const { ethers } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")


!developmentChains.includes(network.name) ? describe.skip : describe("test fundMe contract", async function () {
  let firstAccount
  let secondAccount
  let fundMe
  let fundMeSecondAccount
  let mockV3Aggregator


  beforeEach(async function () {
    await deployments.fixture(["all"])
    firstAccount = (await getNamedAccounts()).firstAccount
    secondAccount = (await getNamedAccounts()).secondAccount
    const fundMeDeployment = await deployments.get("FundMe")
    mockV3Aggregator = await deployments.get("MockV3Aggregator")
    fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
    fundMeSecondAccount = await ethers.getContract(
      "FundMe",
      secondAccount
    )
  })

  it("test if the owner is msg.sender", async function () {

    await fundMe.waitForDeployment()
    assert.equal((await fundMe.owner()), firstAccount)
  })

  it("test if the datafeed is assigned correctly", async function () {
    await fundMe.waitForDeployment()
    assert.equal(await fundMe.dataFeed(), mockV3Aggregator.address)
  })

  // fund,getFund,refund
  // unit test for fund
  // window open, value greater than minium, funder balance
  it("window closed,value greater than minium,fund failed", async function () {
    // make sure the window is closed
    await helpers.time.increase(200)
    await helpers.mine()
    // value is greater than minimum value
    expect(fundMe.fund({ value: ethers.parseEther("0.1") }))
      .to.be.revertedWith("window is closed")
  })

  it("window open,value is less than minium,fund failed", async function () {
    expect(fundMe.fund({ value: ethers.parseEther("0.01") })).to.be.revertedWith(
      "value is less than minimum value"
    )
  })

  it("window open,value is greater than minium,fund success", async function () {
    await fundMe.fund({ value: ethers.parseEther("0.1") })
    const balance = await fundMe.fundersToAmount(firstAccount)
    expect(balance).to.equal(ethers.parseEther("0.1"))

  })

  // unit test for getFund
  // onlyOwner,windowClose,target reached
  it("not Owner,window closed,target reached, getFund failed", async function () {
    // make sure the target is reached
    await fundMe.fund({ value: ethers.parseEther("0.1") })

    // make sure the window is closed
    await helpers.time.increase(200)
    await helpers.mine()
    // 
    expect(fundMeSecondAccount.getFund()).to.be.revertedWith(
      "this function can only be called by owner"
    )
  })

  it("window open, target reached, getFund failed",
    async function () {
      await fundMe.fund({ value: ethers.parseEther("1") })
      await expect(fundMe.getFund())
        .to.be.revertedWith("window is not closed")
    }
  )

  it("window closed,target not reached", async function () {
    await fundMe.fund({ value: ethers.parseEther("0.1") })
    // make sure the window is closed
    await helpers.time.increase(200)
    await helpers.mine()

    await expect(fundMe.getFund()).to.be.revertedWith("Target is not reached")
  })

  it("window closed,target reached,getFund success", async function () {
    await fundMe.fund({ value: ethers.parseEther("1") })
    // make sure the window is closed
    await helpers.time.increase(200)
    await helpers.mine()

    await expect(fundMe.getFund()).to.emit(fundMe, "FundWithdrawByOwner").withArgs(ethers.parseEther("1.1"))

  })

  // refund 
  // windowClosed,target not reached,funder has balance
  it("window open,target not reached,funder has balance", async function () {
    await fundMe.fund({ value: ethers.parseEther("0.1") })
    await expect(fundMe.refund()).to.be.revertedWith("window is not closed")
  })

  it("window closed, target reach, funder has balance",
    async function () {
      await fundMe.fund({ value: ethers.parseEther("1") })
      // make sure the window is closed
      await helpers.time.increase(200)
      await helpers.mine()
      await expect(fundMe.refund())
        .to.be.revertedWith("Target is reached");
    }
  )

  it("window closed, target not reach, funder does not has balance",
    async function () {
      await fundMe.fund({ value: ethers.parseEther("0.1") })
      // make sure the window is closed
      await helpers.time.increase(200)
      await helpers.mine()
      await expect(fundMeSecondAccount.refund())
        .to.be.revertedWith("there is no fund for you");
    }
  )

  it("window closed, target not reached, funder has balance",
    async function () {
      await fundMe.fund({ value: ethers.parseEther("0.1") })
      // make sure the window is closed
      await helpers.time.increase(200)
      await helpers.mine()
      await expect(fundMe.refund())
        .to.emit(fundMe, "RefundByFunder")
        .withArgs(firstAccount, ethers.parseEther("0.1"))
    }
  )
})

