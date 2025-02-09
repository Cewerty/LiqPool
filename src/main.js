import { BrowserProvider, formatUnits, Contract, parseUnits } from 'ethers';
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

async function resetAndApprove(tokenContract, spender, amount) {
    try {
        // Reset allowance to 0
        const resetTx = await tokenContract.approve(spender, 0, { gasLimit: 500000 });
        await resetTx.wait();
        console.log("Allowance reset to 0");

        // Set new allowance
        const approveTx = await tokenContract.approve(spender, amount, { gasLimit: 500000 });
        const receipt = await approveTx.wait();
        console.log("New allowance set:", receipt.status);

        return true;
    } catch (error) {
        console.error("Error resetting/approving allowance:", error.message);
        return false;
    }
}


async function init() {
    try {
      console.log("1. Инициализация...");
      
      if (!window.ethereum) throw new Error("Установите MetaMask");
      
    //   Принудительный сброс подключения (для теста)
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
        // 1. Получаем и валидируем входные значения
        const tokenAAmount = AddLiquidityTokenA.value.trim();
        const tokenBAmount = AddLiquidityTokenB.value.trim();
        
        if (!tokenAAmount || !tokenBAmount) {
            throw new Error("Заполните оба поля");
        }

        // 2. Конвертация в BigNumber с учетом decimals
        const tokenAAmountBN = parseUnits(tokenAAmount, 18);
        const tokenBAmountBN = parseUnits(tokenBAmount, 18);

        // 3. Проверка балансов пользователя
        const [balanceA, balanceB] = await Promise.all([
            firstTokenContract.balanceOf(user_address),
            secondTokenContract.balanceOf(user_address)
        ]);

        console.log(formatUnits(balanceA, 18), formatUnits(balanceB, 18));
        
        if (balanceA < tokenAAmountBN) {
            throw new Error(`Недостаточно токенов A (баланс: ${formatUnits(balanceA, 18)})`);
        }
        if (balanceB < tokenBAmountBN) {
            throw new Error(`Недостаточно токенов B (баланс: ${formatUnits(balanceB, 18)})`);
        }

        // 4. Проверка и обновление разрешений
        const checkAndApprove = async (tokenContract, amount) => {
            const currentAllowance = await tokenContract.allowance(user_address, PoolAddress);
            
            if (currentAllowance < amount) {
                console.log(`Обновление разрешения с ${formatUnits(currentAllowance, 18)} до ${formatUnits(amount, 18)}`);
                const tx = await tokenContract.approve(
                    PoolAddress,
                    amount,
                    { gasLimit: 500000 } // Увеличенный газ для надежности
                );
                await tx.wait(); // Ждем подтверждения
                return true;
            }
            return false;
        };

        // Параллельная обработка разрешений
        await Promise.all([
            checkAndApprove(firstTokenContract, tokenAAmountBN),
            checkAndApprove(secondTokenContract, tokenBAmountBN)
        ]);

        // 5. Симуляция вызова для проверки условий
        try {
            await poolContract.addLiquidity.staticCall(
                tokenAAmountBN,
                tokenBAmountBN,
                { from: user_address } // Важно для корректной симуляции
            );
        } catch (simError) {
            console.error("Симуляция провалена:", simError);
            throw new Error(`Проверка условий не пройдена: ${simError.reason}`);
        }

        // 6. Реальный вызов с увеличенным газом
        const tx = await poolContract.addLiquidity(
            tokenAAmountBN,
            tokenBAmountBN,
            {
                gasLimit: 2_000_000, // Увеличенный лимит газа
                type: 2 // EIP-1559 транзакция
            }
        );
        
        const receipt = await tx.wait();
        console.log("Транзакция успешна:", receipt.hash);

        // 7. Обновление данных интерфейса
        await updatePoolData();
        alert("Лидвидность успешно добавлена!");

    } catch (error) {
        console.error("Полная ошибка:", {
            message: error.message,
            reason: error.reason,
            data: error.data
        });
        alert(`Ошибка: ${error.reason || error.message}`);
    }
});

// Функция обновления данных пула
async function updatePoolData() {
    try {
        const [reserveA, reserveB, totalLiq, lpBalance] = await Promise.all([
            poolContract.tokenAReserve(),
            poolContract.tokenBReserve(),
            poolContract.totalLiquidity(),
            LPTokenContract.balanceOf(user_address)
        ]);

        totalLiquidity.textContent = formatUnits(totalLiq, 18);
        firstTokenLiquidity.textContent = formatUnits(reserveA, 18);
        secondTokenLiquidity.textContent = formatUnits(reserveB, 18);
        LPTokenLiquidity.textContent = formatUnits(lpBalance, 18);

    } catch (error) {
        console.error("Ошибка обновления данных:", error);
    }
};