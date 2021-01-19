const { BN, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ERC20 = artifacts.require('BtuToken');
 
contract('-------------------------> BtuToken', function (accounts) {
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
 it('vérifie si un transfer est bien effectué l´aide de l´implémentation d´Openzeppelin', async function (){
   let balanceOwnerBeforeTransfer = await this.ERC20Instance.balanceOf(owner);
   let balanceRecipientBeforeTransfer = await this.ERC20Instance.balanceOf(recipient);
   let amount = ether("10");
 
   await this.ERC20Instance.transfer(recipient, amount, {from: owner});
 
   let balanceOwnerAfterTransfer = await this.ERC20Instance.balanceOf(owner);
   let balanceRecipientAfterTransfer = await this.ERC20Instance.balanceOf(recipient);
  expect(balanceOwnerAfterTransfer).to.be.bignumber.equal(balanceOwnerBeforeTransfer.sub(amount));
   expect(balanceRecipientAfterTransfer).to.be.bignumber.equal(balanceRecipientBeforeTransfer.add(amount));
 })
});