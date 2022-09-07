//- require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
//- require("./tasks/block-number")
require("@nomiclabs/hardhat-etherscan")   //+
require("@nomiclabs/hardhat-waffle")      //+
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/s-nj9OTPBrtTKzx7n2It6M2h_EUj55HR"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "Oxkey"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "key"

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: [PRIVATE_KEY], 
      chainId: 4,
      blockConfirmations: 6,  //to be used further in 01-deploy-fund-me.js
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      //accounts: from Hardhat itself, the 20 onces, thanks!
      chainId: 31337,
    },  //missed comma
  },
  //solidity: "0.8.7",

  solidity: {
    compilers: [{ version: "0.8.9" }, { version: "0.6.6" }],
  },

  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,   // turned false for 'Testnet demo' section @ 10:55:46. Before this, it was set to true
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
  },
  
  namedAccounts: {
    deployer:{
      default: 0,
      //4: 1 // for rinkeby
      //31337: 2 // for hardhat
    },
    user: {
      default: 1,
    },
  },
}


