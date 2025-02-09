# Simple Pool

That a simple liquidity pool that can swap token and users can add/remove liqudity to stabilize pool liqudity for that users gets LP tokens that represent their part in pool liquidity and can be used in standart ERC-20 operation or for getting their tokens back.

IERC-20: ERC-20 interfase for token.sol and operations with it.
token.sol: smart-contract that implements ERC20 interfase with addtional mint/burn function.
pool.sol: smart-contract with simple liquidity pool that use tokens from token.sol contract and IERC2O for connection to it.
