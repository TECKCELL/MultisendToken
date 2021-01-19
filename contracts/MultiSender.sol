pragma solidity 0.5.12;
import "./dev/OwnedUpgradeabilityStorage.sol";
import "./dev/Claimable.sol";
import "./dev/SafeMath.sol";
import "./dev/address_make_payable.sol";
/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
    function totalSupply() public view returns (uint256);
    function balanceOf(address who) public view returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @title ERC20
 **/
contract ERC20 is ERC20Basic {
    function allowance(address owner, address spender) public view returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function approve(address spender, uint256 value) public returns (bool);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MultiSender is  OwnedUpgradeabilityStorage, Claimable {
    using address_make_payable for address;
    using SafeMath for uint256;

    event Multisended(uint256 total, address tokenAddress);
    event ClaimedTokens(address token, address owner, uint256 balance);

    modifier hasFee() {
        if (currentFee(msg.sender) > 0) {
            require(msg.value >= currentFee(msg.sender));
        }
        _;
    }

    constructor () public {
        setOwner(msg.sender);
        setArrayLimit(200);
        setDiscountStep(0.00005 ether);
        setTokenAddress(0x000000000000000000000000000000000000bEEF);
        setFee(0.05 ether);
        boolStorage[keccak256("rs_multisender_initialized")] = true;
    }

    function() external payable {}



    function initialized() public view returns (bool) {
        return boolStorage[keccak256("rs_multisender_initialized")];
    }
    function tokenAddress() public view returns (address) {
        return addressStorage[keccak256("tokenAddress")];
    }
    function setTokenAddress(address _btuToken) public onlyOwner {
         addressStorage[keccak256("tokenAddress")] = _btuToken;
    }

    function txCount(address customer) public view returns(uint256) {
        return uintStorage[keccak256(abi.encodePacked("txCount", customer))];
    }

    function arrayLimit() public view returns(uint256) {
        return uintStorage[keccak256("arrayLimit")];
    }

    function setArrayLimit(uint256 _newLimit) public onlyOwner {
        require(_newLimit != 0);
        uintStorage[keccak256("arrayLimit")] = _newLimit;
    }

    function discountStep() public view returns(uint256) {
        return uintStorage[keccak256("discountStep")];
    }

    function setDiscountStep(uint256 _newStep) public onlyOwner {
        require(_newStep != 0);
        uintStorage[keccak256("discountStep")] = _newStep;
    }

    function fee() public view returns(uint256) {
        return uintStorage[keccak256("fee")];
    }

    function currentFee(address _customer) public view returns(uint256) {
        if (fee() > discountRate(msg.sender)) {
            return fee().sub(discountRate(_customer));
        } else {
            return 0;
        }
    }

    function setFee(uint256 _newStep) public onlyOwner {
        require(_newStep != 0);
        uintStorage[keccak256("fee")] = _newStep;
    }

    function discountRate(address _customer) public view returns(uint256) {
        uint256 count = txCount(_customer);
        return count.mul(discountStep());
    }

    function multisendToken(address[] memory _contributors, uint256[] memory _balances) public hasFee payable {
            uint256 total = 0;
            require(_contributors.length <= arrayLimit());
            ERC20 tokToken = ERC20(tokenAddress());
            uint8 i = 0;
            for (i; i < _contributors.length; i++) {
                tokToken.transferFrom(msg.sender, _contributors[i], _balances[i]);
                total += _balances[i];
            }
            setTxCount(msg.sender, txCount(msg.sender).add(1));
            emit Multisended(total, tokenAddress());

    }

    function multisendEther(address[] memory _contributors, uint256[] memory  _balances) public payable {
        uint256 total = msg.value;
        uint256 frais = currentFee(msg.sender);
        require(total >= frais);
        require(_contributors.length <= arrayLimit());
        total = total.sub(frais);
        uint256 i = 0;
        for (i; i < _contributors.length; i++) {
            require(total >= _balances[i]);
            total = total.sub(_balances[i]);
            address payable addr = _contributors[i].make_payable();
            addr.transfer(_balances[i]);
        }
        setTxCount(msg.sender, txCount(msg.sender).add(1));
        emit Multisended(msg.value, address(0));
    }

    function claimTokens(address _token) public onlyOwner {
        if (_token == address(0)) {
            address payable addrowner = owner().make_payable();
            addrowner.transfer(address(this).balance);
            return;
        }
        ERC20 tokToken = ERC20(_token);
        uint256 balance = tokToken.balanceOf(address(this));
        tokToken.transfer(owner(), balance);
        emit ClaimedTokens(_token, owner(), balance);
    }

    function setTxCount(address customer, uint256 _txCount) private {
        uintStorage[keccak256(abi.encodePacked("txCount", customer))] = _txCount;
    }

}
