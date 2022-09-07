const {networkConfig, developmentChains} = require("../helper-hardhat-config") //extension .js is not necessary, path of course is...
const {network} = require("hardhat")
const {verify} = require("../utils/verify")

// METHOD # 1:
// async function deployFunc() {
//     console.log("Haan bai, ki banda fir")
// }

// module.exports.default = deployFunc

// METHOD # 2: - manually pulled out
// module.exports = async (hre) => {

// const {getNamedAccounts, deployments} = hre
//     //hre.getNamedAccounts
//     //hre.deployments
// }

// METHOD # 3 - auto-pulling-out mode
module.exports = async ({ getNamedAccounts, deployments}) => { // auto-pulled both of these from hre
    const {deploy, log} = deployments //deploy and log are functions
    const {deployer} = await getNamedAccounts() // deployer is an account
    const chainId = network.config.chainId

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] - statically set
    // dynamically setting it below

    let ethUsdPriceFeedAddress //return to it the most recent deployed instance of the mock-contract, and then pull out the address out of it.
    if (developmentChains.includes(network.name)){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")      // etehrs.getContract() can also be used likewise Raffle.sol
        ethUsdPriceFeedAddress = ethUsdAggregator.address 
    }
    else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]
    const fundMe= await deploy("FundMe", { // this action will be init upon deploying FundMe contrcat thru yarn hardhat deply commmand
        from: deployer,
        args: args, //list of arguments: for now, priceFeedAddress, this goes into the constructor of the contract
        log: true,
        waitConfirmation: network.config.blockConfirmations,  // and not blocks' confirmation which, otherwise, is ideally correct
        //waitConfirmation: network.config.blockConfirmations || 1, ---- by Patrick
        //commented out the above line in actual code 1 above the above line, because it may wait only for 1 block confirmation and etherscan may throw an error stating that wait for at least 5 blockConfirmation before submitting the contract for verification.
        })

        log(`Deployer deploying FundMe: 01-deploy-fund-me.js:, ${deployer}`)

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // verify code (utils) will be executed here. 
        // We only verify on Etherscan (testnet / mainnet), not local network.
        await verify(fundMe.address, args)
    }

    log("------------------------------------------------")
}
module.exports.tags = ["all", "fundme"]