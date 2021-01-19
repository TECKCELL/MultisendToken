pragma solidity 0.5.12;

// We can define a library for explicitly converting ``address``
// to ``address payable`` as a workaround.
library address_make_payable {
   function make_payable(address x) internal pure returns (address payable) {
      return address(uint160(x));
   }
}
