//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 1. 创建一个收款函数
// 2. 记录投资人并且查看
// 3. 在锁定期内，达到目标值，生产商可以提款
// 4. 在锁定期内，没有达到目标值，投资人在锁定期以后退款
contract FundMe {
    event FundWithdrawByOwner(uint256);
    event RefundByFunder(address, uint256);

    AggregatorV3Interface public dataFeed;

    address public owner;
    uint256 deploymentTimestamp;
    uint256 lockTime;

    uint256 constant MINIMUM_VALUE = 1 * 10 ** 18; // USD
    uint256 constant TARGET = 1000 * 10 ** 18;

    mapping(address => uint256) public fundersToAmount;

    bool public getFundSuccess = false;
    address erc20Addr;

    constructor(uint256 _lockTime) {
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    function fund() external payable {
        require(convertETHToUSD(msg.value) >= MINIMUM_VALUE, "Send more ETH");
        require(
            block.timestamp < deploymentTimestamp + lockTime,
            "Not time yet"
        );
        fundersToAmount[msg.sender] = msg.value;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        (
            ,
            /** uint80 roundID,  */
            int answer /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/,
            ,
            ,

        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertETHToUSD(
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return (ethPrice * ethAmount) / 10 ** 18;
    }

    function getFund() public windowClosed onlyOwner {
        require(
            convertETHToUSD(address(this).balance) >= TARGET,
            "Target is not reached"
        );

        bool success;
        uint256 balance = address(this).balance;
        (success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");

        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;

        emit FundWithdrawByOwner(balance);
    }

    function refund() external windowClosed {
        require(
            convertETHToUSD(address(this).balance) < TARGET,
            "Target is  reached"
        );

        require(fundersToAmount[msg.sender] != 0, "there is no fund for you");
        bool success;
        uint256 balance = fundersToAmount[msg.sender];
        (success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");

        fundersToAmount[msg.sender] = 0;
        emit RefundByFunder(msg.sender, balance);
    }

    modifier windowClosed() {
        require(
            block.timestamp < deploymentTimestamp + lockTime,
            "Not time yet"
        );
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can do this");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function setFunderToAmount(
        address funder,
        uint256 amountToUpdate
    ) external {
        require(
            msg.sender == erc20Addr,
            "you do not have permission to call this funtion"
        );
        fundersToAmount[funder] = amountToUpdate;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }
}
