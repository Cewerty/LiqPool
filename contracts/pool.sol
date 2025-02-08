// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.28;

import './IERC20.sol';

contract Pool {
    IERC20 tokenA;
    IERC20 tokenB;
    IERC20 LPtoken;

    uint256 public tokenAReserve;
    uint256 public tokenBReserve;

    uint256 public totalLiquidity;
    mapping (address=>uint256) liqudites;

    event LiquidityAdded(address indexed user, uint256 amountTokenA, uint256 amountTokenB, uint256 liquidity);
    event LiquidityRemoved(address indexed user, uint256 amountTokenA, uint256 amountTokenB, uint256 liquidity);
    event TokensSwapped(address indexed user, uint256 amountIn, uint256 amountOut, bool isTokenAInput);

    constructor(address tokenAAddress, address tokenBAddress, address LPtokenAddress) {
        require(tokenAAddress != address(0) && tokenBAddress != address(0) && LPtokenAddress != address(0), "Invalid token addresses");
        tokenA = IERC20(tokenAAddress);
        tokenB = IERC20(tokenBAddress);
        LPtoken = IERC20(LPtokenAddress);
    }

    function sqrt(uint256 x) public pure returns (uint256 y) {
        if (x == 0) return 0;

        uint256 z = x;
        y = x / 2 + 1;

        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }

        return y;
    }

    function swap(uint256 amountIn, bool isTokenA) public returns (uint256 amountOut) {
        require(isTokenA && tokenAReserve >= amountIn, "Not enough liqudity");
        require(!isTokenA && tokenBReserve >= amountIn, "Not enough liqudity");

        uint256 reserveOut =  isTokenA ? tokenAReserve : tokenBReserve;
        uint256 reserveIn = isTokenA ? tokenBReserve : tokenAReserve;

        amountOut = (reserveOut * amountIn) / (reserveIn + amountIn);

        if (isTokenA) {
            require(tokenB.transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
            require(tokenA.transfer(msg.sender, amountIn), "Token transfer failed");

            tokenAReserve -= amountOut;
            tokenBReserve += amountIn;
        }
        else {
            require(tokenA.transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
            require(tokenB.transfer(msg.sender, amountIn), "Token transfer failed");

            tokenAReserve += amountIn;
            tokenBReserve -= amountOut;
        }
    }

function addLiquidity(uint256 amountTokenA, uint256 amountTokenB) public returns (bool) {
    // Проверка allowance
    // require(
    //     tokenA.allowance(msg.sender, address(this)) >= amountTokenA,
    //     "Token A allowance too low"
    // );
    // require(
    //     tokenB.allowance(msg.sender, address(this)) >= amountTokenB,
    //     "Token B allowance too low"
    // );

        // Проверка разрешений
    require(
        IERC20(tokenA).allowance(msg.sender, address(this)) >= amountTokenA,
        "Token A allowance too low"
    );
    require(
        IERC20(tokenB).allowance(msg.sender, address(this)) >= amountTokenB,
        "Token B allowance too low"
    );
    
    // Дополнительные проверки
    require(amountTokenA > 0 && amountTokenB > 0, "Zero amounts");
    require(
        amountTokenA * tokenBReserve == amountTokenB * tokenAReserve,
        "Invalid ratio"
    );
    
    // Перенос токенов
    require(
        tokenA.transferFrom(msg.sender, address(this), amountTokenA),
        "Token A transfer failed"
    );
    require(
        tokenB.transferFrom(msg.sender, address(this), amountTokenB),
        "Token B transfer failed"
    );


    // Расчет ликвидности
    uint256 liquidity;
    if (totalLiquidity == 0) {
        liquidity = sqrt(amountTokenA * amountTokenB);
    } else {
        uint256 liquidityA = (amountTokenA * totalLiquidity) / tokenAReserve;
        uint256 liquidityB = (amountTokenB * totalLiquidity) / tokenBReserve;
        liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
    }

    // Минт LP-токенов
    LPtoken.mint(liquidity);
    
    // Обновление резервов
    tokenAReserve += amountTokenA;
    tokenBReserve += amountTokenB;
    totalLiquidity += liquidity;

    return true;
}

    function removeLiquidity(uint256 liqudityToRemove) public returns (bool success) {
        require(liqudites[msg.sender] >= liqudityToRemove, "You don not have that amount liqudity");
        require(LPtoken.balanceOf(msg.sender) >= liqudityToRemove, "You don not have anough LP tokens to remove liqudity");
        require(liqudityToRemove > 0, "You can not remove zero liqudity");

        uint256 amountTokenAToRemove = (liqudityToRemove * tokenAReserve) / totalLiquidity;
        uint256 amountTokenBToRemove = (liqudityToRemove * tokenBReserve) / totalLiquidity;

        require(LPtoken.burnFrom(msg.sender, address(this), liqudityToRemove), "Token burn failed");

        tokenAReserve -= amountTokenAToRemove;
        tokenBReserve -= amountTokenBToRemove;
        
        return true;
    }
}