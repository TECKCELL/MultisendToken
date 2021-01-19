const OptimisationGasTest = artifacts.require("OptimisationGasTest");
const BtuToken = artifacts.require("BtuToken");
const MultiSender = artifacts.require("MultiSender");

module.exports = function(deployer) {
  deployer.deploy(OptimisationGasTest);
  deployer.deploy(BtuToken);
  deployer.deploy(MultiSender);
};
