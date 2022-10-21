// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

error FundMe__NotOwner();


//NatSpec (Doxygen style) with PERMISSIBLE tags(@)
/** @title = FundMe // @(smallcase)
 *  @author = Manu Kapoor
 *  @notice = 
 *  @dev = 
 */

contract FundMe {
    using PriceConverter for uint256;
    // using 'Library' for 'Type'

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private /* immutable */ i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;    
    // for users, it's USD 50.00 only, internally, for calc., we made it 50 * 10 ** 18
    
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
       //console.log("Contract Deployed by %s", i_owner);
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
        console.log("Contract Deployed by %s", i_owner);
    }

    receive() external payable {
        fund();
    }
    fallback() external payable {
        fund();
    }

    // function gets_priceFeed() public view returns (AggregatorV3Interface) {
    //     return s_priceFeed;
    // }

    /**
    * @notice = 
    * @dev
    * @param 
    */
    function fund() public payable {
        // we can only send ETH_Amount in {value} (recall Remix)... 
        // to compare it with total USD that it's worth, we have to get ts price from AggV3Int... 
        // then compare with MINIMUM_USD
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,"You need to spend more ETH buddy!");
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }
    
    // function getVersion() public view returns (uint256){
    //     AggregatorV3Interface s_priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
    //     return s_priceFeed.version();
    // }
    
       /**
    * @notice = 
    * @dev
    * @param
     */

    function withdraw() onlyOwner public {
        for (uint256 funderIndex=0; funderIndex < s_funders.length; funderIndex++){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // nullify the array now
        s_funders = new address[](0);
        // state changed above: to avoid reentrancy, send at the end

        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 funderIndex=0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0); //actual / real array has to be reset to 0 (outright nullified), not the dummy one (memory)
    
    (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    // 4 getter functions for 4 private declared variables to understand Gas optimisation...

    function getOwner() public view returns(address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address){
        return s_funders[index];
    }

    function getAmountToAddressFunded(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}


    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \ 
    //         yes  no
    //         /     \
    //    receive()?  fallback() 
    //     /   \ 
    //   yes   no
    //  /        \
    //receive()  fallback()


// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly


