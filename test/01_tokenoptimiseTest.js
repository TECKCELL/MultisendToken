const { BN, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ERC20 = artifacts.require('OptimisationGasTest');
 
contract('____________________________OptimisationGasTest', function (accounts) {
 const _name = 'BTU Protocol';
 const _symbol = 'BTU';
 const _decimals = new BN(18);
 const owner = accounts[0];
 const recipient = accounts[1];
 const recipients1 = [accounts[2], accounts[3], accounts[4]]
  beforeEach(async function () {
   this.ERC20Instance = await ERC20.new({from: owner});
 });
 it('a un nom', async function () {
   expect(await this.ERC20Instance.name()).to.equal(_name);
 });
 it('a un symbole', async function () {
   expect(await this.ERC20Instance.symbol()).to.equal(_symbol);
 });
 it('a une valeur décimal', async function () {
   expect(await this.ERC20Instance.decimals()).to.be.bignumber.equal(_decimals);
 });
 it('vérifie la balance du propriétaire du contrat', async function (){
   let balanceOwner = await this.ERC20Instance.balanceOf(owner);
   let totalSupply = await this.ERC20Instance.totalSupply();
   expect(balanceOwner).to.be.bignumber.equal(totalSupply);
 });
 it('01-vérifie si un transfer est bien effectué l´aide de l´implémentation d´Openzeppelin', async function (){
   let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
   let balanceRecipientBeforeTransfer = await this.ERC20Instance.balanceOf(recipient);
   let amount = ether("10");
 
   await this.ERC20Instance.transfer(recipient, amount, {from: owner});
 
   let balanceOwnerAfterTransfer = await this.ERC20Instance.balanceOf(owner);
   let balanceRecipientAfterTransfer = await this.ERC20Instance.balanceOf(recipient);
  expect(balanceOwnerAfterTransfer).to.be.bignumber.equal(balanceOwnerBeforeTransfer.sub(amount));
   expect(balanceRecipientAfterTransfer).to.be.bignumber.equal(balanceRecipientBeforeTransfer.add(amount));
 })
 it('02-vérifie si un transfer est bien effectué l´aide de l´implémentation de ConsenSys', async function (){
    let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipientBeforeTransfer = await this.ERC20Instance.balanceOf(recipient);
    let amount = ether("10");
  
    await this.ERC20Instance.transferConsenSys(recipient, amount, {from: owner});
  
    let balanceOwnerAfterTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipientAfterTransfer = await this.ERC20Instance.balanceOf(recipient);
   expect(balanceOwnerAfterTransfer).to.be.bignumber.equal(balanceOwnerBeforeTransfer.sub(amount));
    expect(balanceRecipientAfterTransfer).to.be.bignumber.equal(balanceRecipientBeforeTransfer.add(amount));
  })
  it('03-vérifie si un transfer est bien effectué l´aide de l´implémentation de  Ethereum Solidity', async function (){
    let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipientBeforeTransfer = await this.ERC20Instance.balanceOf(recipient);
    let amount = ether("10");
  
    await this.ERC20Instance.transferETRMethod(recipient, amount, {from: owner});
  
    let balanceOwnerAfterTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipientAfterTransfer = await this.ERC20Instance.balanceOf(recipient);
   expect(balanceOwnerAfterTransfer).to.be.bignumber.equal(balanceOwnerBeforeTransfer.sub(amount));
    expect(balanceRecipientAfterTransfer).to.be.bignumber.equal(balanceRecipientBeforeTransfer.add(amount));
  })
  it('04-vérifie si un transfer est bien effectué l´aide de l´implémentation de  sendBatch', async function (){
    let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipient1BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[2]);
    let balanceRecipient2BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[3]);
    let balanceRecipient3BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[4]);
    let amount = ether("10");
    let totalAmmounts = ether("30");
    let amounts = [amount, amount, amount]
  
    await this.ERC20Instance.sendBatch(recipients1, amounts, {from: owner});
  
    let balanceOwnerAfterTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipient1AfterTransfer = await this.ERC20Instance.balanceOf(accounts[2]);
    let balanceRecipient2AfterTransfer = await this.ERC20Instance.balanceOf(accounts[3]);
    let balanceRecipient3AfterTransfer = await this.ERC20Instance.balanceOf(accounts[4]);
   expect(balanceOwnerAfterTransfer).to.be.bignumber.equal(balanceOwnerBeforeTransfer.sub(totalAmmounts));
    expect(balanceRecipient1AfterTransfer).to.be.bignumber.equal(balanceRecipient1BeforeTransfer.add(amount));
    expect(balanceRecipient2AfterTransfer).to.be.bignumber.equal(balanceRecipient2BeforeTransfer.add(amount));
    expect(balanceRecipient3AfterTransfer).to.be.bignumber.equal(balanceRecipient3BeforeTransfer.add(amount));
  })
  it('05-vérifie si un transfer est bien effectué l´aide de l´implémentation de  sendBatchCS', async function (){
    let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
    let balanceRecipient1BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[2]);
    let balanceRecipient2BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[3]);
    let balanceRecipient3BeforeTransfer = await this.ERC20Instance.balanceOf(accounts[4]);
    let amount = ether("10");
    let totalAmmounts = ether("30");
    let amounts = [amount, amount, amount]
  
    await this.ERC20Instance.sendBatchCS(recipients1, amounts, {from: owner});
  
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