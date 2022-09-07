//const { inputToConfig } = require("@ethereum-waffle/compiler")

// ALL JULY 22

const { assert } = require("chai")
const { getNamedAccounts, ethers, network} = require("hardhat")
const {developmentChains} = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
? describe.skip
: describe("FundMe", async function () {
    let fundMe
    let deployer
    const sendValue = "20000000000000000" //0.02 RinkebyETH, mine balance is 0.08+
    //const sendValue = ethers.utils.parseEther("1") / This address only has 0.08+ RinkebyETH for now => Insufficient funds.

    beforeEach(async function() {
        deployer = await (getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer) // getContract DOES NOT deploy the contract by itself. It pulls the latest deployed instance of the contract.
    })

    it("should allow the funder to fund and withdraw the amount", async function () {
        //Funding...
        const transactionResponse01 = await fundMe.fund({value: sendValue})
        await transactionResponse01.wait(1)
        //checking balance...
        const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
        console.log(`Starting FundMe balance: ${startingFundMeBalance}`)
        //Withdrawing...
        const transactionResponse = await fundMe.withdraw()
        await transactionResponse.wait(1)
        //checking balance...
        const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address) // returns Promise <BigNumber>
        console.log(`Ending FundMe balance: ${endingFundMeBalance}`)
        //Assert...
        assert.equal(endingFundMeBalance.toString(),"0")
    })
})