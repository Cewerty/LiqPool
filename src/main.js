import { BrowserProvider, formatUnits, Contract, parseUnits } from 'ethers';
// import { BrowserProvider, Contract, parseUnits, formatUnits } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js';
import TokenABI from '../artifacts/contracts/token.sol/Token.json' with {type:'json'};
import PoolABI from '../artifacts/contracts/pool.sol/Pool.json' with {type:'json'};

let signer;
let provider;
let user_address;


const tokensABI = TokenABI.abi;
const poolABI = PoolABI.abi;

let firstTokenContract;
let secondTokenContract;
let LPTokenContract;
let poolContract;

const firstTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const SecondTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const LPTokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const PoolAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const totalLiquidity = document.getElementById("totalLiqudity");
const firstTokenLiquidity = document.getElementById("firstTokenLiqudity");
const secondTokenLiquidity = document.getElementById("secondTokenLiqudity");
const LPTokenLiquidity = document.getElementById("LpTokenBalance");


const AddLiquidityForm = document.getElementById("AddLiqudityForm");
const AddLiquidityTokenA = document.getElementById("amountA");
const AddLiquidityTokenB = document.getElementById("amountB");

const RemoveLiquidityForm = document.getElementById("liquidityRemoveForm");
const RemoveAmount = document.getElementById("liquidityToRemove");

const SwapTokenForm = document.getElementById("SwapTokensForm");
const SwapTokenAmount = document.getElementById("amountIn");
const SwapTokenIsTokenA = document.getElementById("isTokenA");


async function init() {
    try {
      console.log("1. Инициализация...");
      
      if (!window.ethereum) throw new Error("Установите MetaMask");
      
      // Принудительный сброс подключения (для теста)
    //   await window.ethereum.request({ 
    //     method: "wallet_requestPermissions",
    //     params: [{ eth_accounts: {} }]
    //   });
  
      provider = new BrowserProvider(window.ethereum);
      console.log("2. Провайдер создан");
  
      const network = await provider.getNetwork();
      console.log("3. Сеть:", network.chainId);
  
      signer = await provider.getSigner();
      console.log("4. Signer получен");
  
      user_address = await signer.getAddress();
      console.log("5. Адрес пользователя:", user_address);
  
      poolContract = new Contract(PoolAddress, poolABI, signer);
      LPTokenContract = new Contract(LPTokenAddress, tokensABI, signer);
      secondTokenContract = new Contract(SecondTokenAddress, tokensABI, signer);
      firstTokenContract = new Contract(firstTokenAddress, tokensABI, signer);
      console.log("6. Контракт инициализирован");
  
    const totalLiq = await poolContract.totalLiquidity({gasLimit: 1_000_000});
    const reserveTokenA = await poolContract.tokenAReserve();
    const reserveTokenB = await poolContract.tokenBReserve();
    const LpBalance = await LPTokenContract.balanceOf(user_address);
  
    totalLiquidity.innerText = totalLiq;
    firstTokenLiquidity.innerText = reserveTokenA;
    secondTokenLiquidity.innerText = reserveTokenB;
    LPTokenLiquidity.innerText = formatUnits(LpBalance, 18);
      
    } catch (error) {
      console.error("ФИНАЛЬНАЯ ОШИБКА:", error);
      alert(`Ошибка: ${error?.reason || error.message}`);
    }
  }

window.addEventListener('load', () => {
    init().catch(console.error);
});


AddLiquidityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    try {
        // 1. Получаем значения
        const tokenAAmount = AddLiquidityTokenA.value.trim();
        const tokenBAmount = AddLiquidityTokenB.value.trim();

        // 2. Конвертация с учетом decimals
        const tokenAAmountBN = parseUnits(tokenAAmount, 18);
        const tokenBAmountBN = parseUnits(tokenBAmount, 18);

        // 3. Проверка балансов
        const balanceA = await firstTokenContract.balanceOf(user_address);
        const balanceB = await secondTokenContract.balanceOf(user_address);
        
        console.log("Балансы:", {
            tokenA: formatUnits(balanceA, 18),
            tokenB: formatUnits(balanceB, 18)
        });

        // 4. Одобрения с обработкой ошибок
        const approveTokenA = await firstTokenContract.approve(
            PoolAddress, 
            tokenAAmountBN, 
            {gasLimit: 500000}
        );
        const receiptA = await approveTokenA.wait();
        console.log("Approval A Status:", receiptA.status);

        const approveTokenB = await secondTokenContract.approve(
            PoolAddress, 
            tokenBAmountBN, 
            {gasLimit: 500000}
        );
        const receiptB = await approveTokenB.wait();
        console.log("Approval B Status:", receiptB.status);

        // 5. Симуляция вызова
        try {
            const simulated = await poolContract.addLiquidity.staticCall(
                tokenAAmountBN,
                tokenBAmountBN
            );
            console.log("Симуляция успешна:", simulated);
        } catch (simError) {
            console.error("Ошибка симуляции:", simError);
            throw new Error(`Проверка не пройдена: ${simError.reason}`);
        }

        // 6. Реальный вызов
        const tx = await poolContract.addLiquidity(
            tokenAAmountBN,
            tokenBAmountBN,
            {
                gasLimit: 2_000_000,
                type: 2 // EIP-1559
            }
        );
        
        const receipt = await tx.wait();
        console.log("Receipt:", receipt);

        alert("Лидвидность успешно добавлена!");

    } catch (error) {
        console.error("Полная ошибка:", {
            message: error.message,
            reason: error.reason,
            code: error.code,
            data: error.data
        });
        alert(`Ошибка: ${error.reason || error.message}`);
    }
});