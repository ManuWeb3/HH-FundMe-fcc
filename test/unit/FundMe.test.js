//const { inputToConfig } = require("@ethereum-waffle/compiler")
const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const {developmentChains} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ?
describe.skip
: describe("FundMe", function () {
    //  "deployer" has to be declared globally with "let" as it'll be used in many "it" blocks down.
    //  that's why deployer = (await getNamedAccounts()).deployer syntax used in beforeEach()
    let fundMe, deployer, mockV3Aggregator// big issue, scope has to be global for it() to access all these, should not be inside beforeEach
    //const sendValue = "1000000000000000000" // 1 ETH // will check parseEther and parseUnits - July 20
    const sendValue = ethers.utils.parseEther("1") //- July 20

    beforeEach(async function () {                      // deploy FundMe contract using Hardhat-deploy => FundMe deployment will come along with our 00 and 01 deploy scripts in deploy folder.
        
        //const accounts = await ethers.getSigners()    // July 19
        //const accountZero = accounts[0]               //July 19

        deployer = (await getNamedAccounts()).deployer  // line expl. in July 18, 2022 + updated July 19
        await deployments.fixture(["all"])              // eveyrthing gets executed in the deploy folder with this.
        // Raffle. syntax use - const {deployer} = await getNamedAccounts(), also works
        // getContract() for both
        fundMe = await ethers.getContract("FundMe", deployer)   //export ethers from HH, HH-deploy wraps ethers with getContract function, as Patrick said it verbose.
        //getContract()returns the most recent deployed instance of the contract
       // console.log(`Deployer deploying FundMe, ${deployer}`)
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer) //address where this gets deployed
    })
    
    describe("Constructor", function () {   //July 20
        it("Should check that Aggregator addreses are set correctly", async function () {
            const response = await fundMe.getPriceFeed()
           // console.log(`Address of getPriceFeed's deployment ${response}`)
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund function", function () {
        it("should Fail if enough ETH is not sent", async function () {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH buddy!") //July 20
        })

        it("Updated the amount-funded Data Structure", async function (){
            await fundMe.fund({value: sendValue}) // July 20
            const response = await fundMe.getAmountToAddressFunded(deployer) // July 20
            assert.equal(response.toString(), sendValue.toString()) // July 20 --grep = Globally search for a Regular Expression and Print
        })

        it("should update the getFunders array", async function () {
            await fundMe.fund({value: sendValue})
            const funder = await fundMe.getFunders(0)
            //console.log(deployer)
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw function", function () {
        beforeEach(async function () {
            await fundMe.fund({value: sendValue})
        })

        it("Should withdraw ETH only by single funder", async function () { //does not test the modifier onlyOwner
            // 3-step methodology to think of while writing a (longer) test:
            //1. Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address) // July 20
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            //2. Act // Action to call withdraw function now
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            //console.log(`gasCost ${gasCost}, gasUsed ${gasUsed}, effectiveGasprice ${effectiveGasPrice}`)
            const {gasUsed, effectiveGasPrice} = transactionReceipt // July 21
            const gasCost = gasUsed.mul(effectiveGasPrice) // because both of these are BigNumber objects - we saw their object type in the Debug log

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            //3. Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString())
            //endingDeployerBalance.toString()) //gasCost wasn't known by then
        })

        it("should allow us to withdraw with multiple getFunders", async function () {
            //1. Arrange
            const accounts = await ethers.getSigners() //July 21
            //console.log(`Account no. Zero: ${accounts[0].address}`)
            for (let i = 1; i < 20; i++ ) {
                const fundMeConnectedContract =fundMe.connect(accounts[i]) // how come it's const???
                await fundMeConnectedContract.fund({value: sendValue})
                //console.log(`Value each time: ${fundMeConnectedContract}`)
            } 
            //Outside of the loop now. - into 'totality now. Total-balance of FundMe contract + all total will go to deployer
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            //2. Act - copy pasted above Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            //console.log(`gasCost ${gasCost}, gasUsed ${gasUsed}, effectiveGasprice ${effectiveGasPrice}`)
            const {gasUsed, effectiveGasPrice} = transactionReceipt // July 21
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            //3. Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString())

            //Make sure array gets reset
            expect(fundMe.getFunders(0)).to.be.reverted // revertedWith("string") won't get through becaise there was no such "string" in the actual code linked to array getting reset.

            //Make sure that all balances are set to Zero now.
            for (let i=1; i<20; i++) {       // limit of no. of accounts set to total 5, hardcoded by i<6, haerdocing ok in testing, whereas dynamic is good in coding
            assert.equal(await fundMe.getAmountToAddressFunded(accounts[i].address), 0)
            }

        })

        it("Only allow the owner to withdraw the funds", async function (){
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerFundMeConnected = await fundMe.connect(attacker)
            // for contract.connect(accounts[1]), NOT (accounts[1].address), UNLIKE getContract("contract", deployer)...
            // where deployer = accounts[0].address
            await expect (attackerFundMeConnected.withdraw()).to.be.revertedWith("FundMe__NotOwner")
        })

        it("cheaperWithdraw testing.../ Single-funder-withdraw", async function () { //does not test the modifier onlyOwner
            // 3-step methodology to think of while writing a (longer) test:
            //1. Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address) // July 20
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            //2. Act // Action to call withdraw function now
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            //console.log(`gasCost ${gasCost}, gasUsed ${gasUsed}, effectiveGasprice ${effectiveGasPrice}`)
            const {gasUsed, effectiveGasPrice} = transactionReceipt // July 21
            const gasCost = gasUsed.mul(effectiveGasPrice) // because both of these are BigNumber objects - we saw their object type in the Debug log

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            //3. Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString())
            //endingDeployerBalance.toString()) //gasCost wasn't known by then
        })

        it("cheaperWithdraw testing.../ Multi-funder-withdraw", async function () {
            //1. Arrange
            const accounts = await ethers.getSigners() //July 21
            //console.log(`Account no. Zero: ${accounts[0].address}`)
            for (let i = 1; i < 20; i++ ) {
                const fundMeConnectedContract =fundMe.connect(accounts[i]) // how come it's const???
                await fundMeConnectedContract.fund({value: sendValue})
                //console.log(`Value each time: ${fundMeConnectedContract}`)
            } 
            //Outside of the loop now. - into 'totality now. Total-balance of FundMe contract + all total will go to deployer
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            //2. Act - copy pasted above Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            //console.log(`gasCost ${gasCost}, gasUsed ${gasUsed}, effectiveGasprice ${effectiveGasPrice}`)
            const {gasUsed, effectiveGasPrice} = transactionReceipt // July 21
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            //3. Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString())

            //Make sure array gets reset
            expect(fundMe.getFunders(0)).to.be.reverted // revertedWith("string") won't get through becaise there was no such "string" in the actual code linked to array getting reset.

            //Make sure that all balances are set to Zero now.
            for (let i=1; i<20; i++) {       // limit of no. of accounts set to total 5, hardcoded by i<6, haerdocing ok in testing, whereas dynamic is good in coding
            assert.equal(await fundMe.getAmountToAddressFunded(accounts[i].address), 0)
            }

        })
    })
})

