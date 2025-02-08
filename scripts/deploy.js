import hre from 'hardhat';
// const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const tokenFactory = await hre.ethers.getContractFactory("Token");
    
    const initialSupply = hre.ethers.parseUnits('1000000', 18);

    const firstToken = await tokenFactory.deploy(initialSupply, 18, "FirstToken", "FT");

    firstToken.waitForDeployment();

    const firstTokenAddress = await firstToken.getAddress();

    const secondToken = await tokenFactory.deploy(initialSupply, 18, "SecondToken", "ST");

    secondToken.waitForDeployment();

    const SecondTokenAddress = await secondToken.getAddress();

    const LPToken = await tokenFactory.deploy(0, 18, "LPToken", "LP");

    LPToken.waitForDeployment();

    const LPTokenAddress = await LPToken.getAddress();

    const PoolFactory = await hre.ethers.getContractFactory("Pool", deployer);

    const Pool = await PoolFactory.deploy(firstTokenAddress, SecondTokenAddress, LPTokenAddress);

    Pool.waitForDeployment();

    const PoolAddress = await Pool.getAddress();

    console.log("Адрес первого токена: ", firstTokenAddress);
    console.log("Адрес второго токена: ", SecondTokenAddress);
    console.log("Адрес LP токена: ", LPTokenAddress);
    console.log("Адрес пула ликвидности: ", PoolAddress);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error('Ошибка в процессе развертывания:', error);
    process.exit(1);
});