// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.28;

interface IERC20 {
    function approve(address _spender, uint256 _amount) external returns(bool);
    function transfer(address _to, uint256 _amount) external returns(bool);
    function transferFrom(address _from, address _to, uint256 _amount) external returns(bool);
    function allowance(address _owner, address _spender) external returns(uint256);
    function balanceOf(address _owner) external returns(uint256);
    function mint(uint256 _amount) external returns (bool success);
    function burn(uint256 _amount) external returns (bool success);
    function burnFrom(address _owner, address _burner, uint256 _amount) external returns(bool);
}