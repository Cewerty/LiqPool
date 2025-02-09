// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.28;

import './IERC20.sol';

contract Token is IERC20 {
    string public name;
    string public symbol;
    uint256 public decimals;
    uint256 public totalSupply;
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    event Transfer(address indexed _from, address indexed _to, uint256 _amount);
    event Approval(address indexed _owner, address indexed _spender, uint256 _amount );

    modifier onlyOwner() {
        require(msg.sender == owner, "This function only for owner");
        _;
    }

    constructor(uint initialSupply, uint256 decimal, string memory Name, string memory Symbol) {
        name = Name;
        decimals = decimal;
        symbol = Symbol;
        totalSupply = initialSupply;
        owner = msg.sender;
        balances[msg.sender] += totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function approve(
        address _spender,
        uint256 _amount
    ) external override returns (bool success) {
        allowances[msg.sender][_spender] += _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transfer(
        address _to,
        uint256 _amount
    ) external override returns (bool success) {
        require(_amount > 0, "You can't send zero tokens");
        require(balances[msg.sender] >= _amount, "You can't send more tokens than you have");
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;

        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external override returns (bool success) {
        require(balances[_from] >= _amount, "You can't send more tokens than user have");
        require(allowances[_from][msg.sender] >= _amount, "Token amount exceed allowance");

        balances[_from] -= _amount;
        balances[_to] += _amount;

        emit Transfer(_from, _to, _amount);
        return true;
    }

    function allowance(
        address _owner,
        address _spender
    ) external override view returns (uint256) {
        return allowances[_owner][_spender];
    }

    function balanceOf(address _owner) external override view returns (uint256) {
        return balances[_owner];
    }

    function mint(uint256 _amount) public returns (bool success) {
        require(_amount > 0, "You can't mint zero tokens");
        totalSupply += _amount;
        balances[msg.sender] += _amount;
        return true;
    }

    function burn(uint256 _amount) public returns (bool success) {
        require(balances[msg.sender] < _amount, "You can't burn more tokens than you have");
        require(_amount > 0, "You can't burn zero tokens");

        balances[msg.sender] -= _amount;
        totalSupply -= _amount;
        return true;
    }

    function burnFrom(address _owner, address _burner, uint256 _amount) public returns(bool success) {
        require(allowances[_owner][_burner]>= _amount, "Allowance exided");
        require(_amount > 0, "You can not burn zero tokens");

        balances[_owner] -= _amount;
        totalSupply -= _amount;
        
        return true;
    }
}