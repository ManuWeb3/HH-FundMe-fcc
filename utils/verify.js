const {run} = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifying the contract, please wait...")
    try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args, //what this constructor arguments : args is doing here??
                                  // I believe - it's taking in those args that's required to be passed into the Constructor of FundMe.sol while deploying
  })}
  
  catch (e) {

    if(e.message.toLowerCase().includes("already verified")) {
        console.log("Already Verified")
      }
      else {
        console.log(e)
      }
    }
} // body of verify
      
module.exports = {verify}