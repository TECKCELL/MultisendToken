const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ERC20 = artifacts.require('BtuToken');
const multiSender = artifacts.require('MultiSender');
 
contract('-_-__--_--_--_------____ MultiSender', function (accounts) {
 const _currentFee = ether("0.05");
 const _arrayLimit = new BN(200);
 const owner = accounts[0];
 const recipients1 = [accounts[2], accounts[3], accounts[4]]
  beforeEach(async function () {
   this.ERC20Instance = await ERC20.new({from: owner});
   this.BtuTokenAddress = this.ERC20Instance.address;
   this.multiSenderInstance = await multiSender.new({from: owner});
   this.multiSenderAddress = this.multiSenderInstance.address;
 });
 it('configure et vérifie BtuTokenAddress:', async function (){
    await this.multiSenderInstance.setTokenAddress(this.BtuTokenAddress);
   expect(await this.multiSenderInstance.tokenAddress()).to.equal(this.BtuTokenAddress)
 });
 it('a une valeur "currenteFee":', async function (){
  let currentFee = await this.multiSenderInstance.currentFee(owner);
 
 expect(currentFee).to.be.bignumber.equal(_currentFee);
});
 
it('a une valeur "arrayLimit":', async function (){
  
  expect(await this.multiSenderInstance.arrayLimit()).to.be.bignumber.equal(_arrayLimit);
 });
 it(' vérifie approve et allowance:', async function (){
    let totalAmmounts = ether("30");
    await this.ERC20Instance.approve(this.multiSenderAddress, totalAmmounts, {from: owner});
    let allowance = await this.ERC20Instance.allowance(owner,this.multiSenderAddress);
    expect(allowance).to.be.bignumber.equal(totalAmmounts)
 });

  it('vérifie si un transfer est bien effectué l´aide dapp Multisender  ', async function (){
    let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipient1BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[2]);
    let balanceRecipient2BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[3]);
    let balanceRecipient3BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[4]);
    let amount = ether("10");
    let totalAmmounts = ether("30");
    let amounts = [amount, amount, amount]
    console.log("step 1 set up the Token Address");
    await this.multiSenderInstance.setTokenAddress(this.BtuTokenAddress);
    console.log("Step 2 Approve totalAmmount to send")
    await this.ERC20Instance.approve(this.multiSenderAddress, totalAmmounts, {from: owner});
   
   
    console.log("Step 2 send Toknes to addresses")
   await this.multiSenderInstance.multisendToken(recipients1, amounts, 
    {from: accounts[0], 
     value: 0.05 *10**18
    }
    );
  
    let balanceOwnerAfterTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipient1AfterTransfer = await this.ERC20Instance.balanceOf(accounts[2]);
    let balanceRecipient2AfterTransfer = await this.ERC20Instance.balanceOf(accounts[3]);
    let balanceRecipient3AfterTransfer = await this.ERC20Instance.balanceOf(accounts[4]);
   expect(balanceOwnerAfterTransfer).to.be.bignumber.equal(balanceOwnerBeforeTransfer.sub(totalAmmounts));
    expect(balanceRecipient1AfterTransfer).to.be.bignumber.equal(balanceRecipient1BeforeTransfer.add(amount));
    expect(balanceRecipient2AfterTransfer).to.be.bignumber.equal(balanceRecipient2BeforeTransfer.add(amount));
    expect(balanceRecipient3AfterTransfer).to.be.bignumber.equal(balanceRecipient3BeforeTransfer.add(amount));
  })
});