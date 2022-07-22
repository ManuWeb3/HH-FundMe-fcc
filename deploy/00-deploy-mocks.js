const {network} = require("hardhat")
const {developmentChains, DECIMALS, INITIAL_ANSWER} = require("../helper-hardhat-config") //extension .js is not necessary, path of course is...


//Because of the error - not finding helper-config file, I'm hardcoding all 3 values here (developmentChains, DECIMALS, INITIAL_ANSWER)

//const DECIMALS = "8"
//const INITIAL_ANSWER = "200000000000" // actual value = 2000 with 8 decimals

module.exports = async ({ getNamedAccounts, deployments}) => { // auto-pulled both of these from hre

    const {deploy, log} = deployments //deploy and log are functions
    const {deployer} = await getNamedAccounts() // deployer is an account
    const chainId = network.config.chainId // in case chainId is not there, we will use chain.name (or direct value 31337) in the if struct below instead of chainId

    if(developmentChains.includes(network.name)){               // in place of -- developmentChains.includes(chain.name) condition, we hardcoded it to 31337, for now.
        log("Local network (not testnets/mainnet) detected, deploying the mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, // outputs all these 4 values: deploying "MockV3Aggregator" (tx: 0x2f60bd4cba5dffe33cd22380f4891cfadb7f13aad763bb084e8a1c3336b892f9)...: deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 with 569635 gas
            args: [DECIMALS, INITIAL_ANSWER],
        })

        log(`Deployer deploying FundMe: 01-deploy-fund-me.js:, ${deployer}`)
        //to be incl. in the 'if' structure itself
        log("00: Mocks deployed!!")
        log("---------------------------------------------")
    }

}

module.exports.tags = ["all", "mocks"]