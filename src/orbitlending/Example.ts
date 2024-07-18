import 'dotenv/config';
import { ethers } from 'ethers';



const main = async () => {
    // Инициализация провайдера, подписанта и адресов контрактов
    const provider = new ethers.providers.JsonRpcProvider("https://rpc.blast.io");
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, provider);

    // Адреса контрактов
    const spaceStationAddress = "0x1E18C3cb491D908241D0db14b081B51be7B6e652";
    const oEtherAddress = "0x0872b71efc37cb8dde22b2118de3d800427fdba0";
    const oUSDBAddress = "0x9aECEdCD6A82d26F2f86D331B17a1C1676442A87";

    // ABI контрактов (импортируемые из JSON файлов)
    const SpaceStationABI = require('./spacestation_abi.json');
    const OTokenABI = require('./otoken_abi.json');

    // Настройка контрактов
    const spaceStationContract = new ethers.Contract(spaceStationAddress, SpaceStationABI, signer);
    const oEtherContract = new ethers.Contract(oEtherAddress, OTokenABI, signer);
    const oUSDBContract = new ethers.Contract(oUSDBAddress, OTokenABI, signer);

    const balance = await provider.getBalance(signer.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.lt(ethers.utils.parseEther("0.001"))) {
        throw new Error("Insufficient balance to cover gas fees.");
    }

    // Операция по займу (1 ETH) - Внесение средств и начисление APY
    const lendTx = await oEtherContract.mint(ethers.utils.parseUnits('0.001', 18));

    console.log(`Transaction Hash: ${lendTx.hash}`);
    await lendTx.wait(); console.log('ETH successfully lent.');

    // Включение ETH в качестве залога
    const enableCollateralTx = await spaceStationContract.enterMarkets([oEtherAddress]);
    console.log(`Transaction Hash: ${enableCollateralTx.hash}`);
    await enableCollateralTx.wait(); console.log('Collateral enabled.');

    // Операция по займу (1 USDB)
    const borrowTx = await oUSDBContract.borrow(ethers.utils.parseUnits('1', 18)); console.log(`Transaction Hash: ${borrowTx.hash}`);
    await borrowTx.wait();console.log('1 USDB borrowed.');

    // Отслеживание позиции LTV
    const { liquidity, shortfall } = await spaceStationContract.getAccountLiquidity(signer.address);
    console.log(`Liquidity: ${liquidity}`);
    console.log(`Shortfall: ${shortfall}`);

    // Процесс погашения (включая начисленные проценты)
    const owedAmount = (await oUSDBContract.getAccountSnapshot(signer.address))[2]; // Получение суммы задолженности
    const approveTx = await oUSDBContract.approve(oUSDBAddress, owedAmount); // Утверждение суммы задолженности для передачи
    await approveTx.wait();
    const repayTx = await oUSDBContract.repayBorrow(owedAmount); // Погашение суммы задолженности
    await repayTx.wait();

    // Вывод залога (ETH)
    const withdrawTx = await oEtherContract.redeemUnderlying(ethers.utils.parseUnits('0.001', 18));
    await withdrawTx.wait();
 }

main().catch(console.error);
