import { ethers } from 'ethers';
import { CrocEnv } from './croc';

const RPC_URL = "https://rpc.blast.io";
const USDB_ADDRESS = "0x4300000000000000000000000000000000000003";
const PRIVATE_KEY = "";
const ETH_ADDRESS = ethers.constants.AddressZero;
const ETH_AMOUNT = ethers.utils.parseEther('0.0005'); // 0.0005 ETH
const SLIPPAGE = 0.01;

async function placeSwapOrder() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const croc = new CrocEnv("blast", wallet);

    // Получаем текущую цену для ETH/USDB
    const crocPool = croc.poolEthQuote(USDB_ADDRESS);
    const displayPrice = await crocPool.displayPrice();
    const spotPrice = await crocPool.spotPrice();

    console.log(Display Price for ETH/USDB: ${displayPrice});
    console.log(Spot Price for ETH/USDB: ${spotPrice});

    const options = {
        slippage: SLIPPAGE,
    };

    const swapPlan = croc.sellEth(ETH_AMOUNT).for(USDB_ADDRESS, options);

    try {
        const transactionResponse = await swapPlan.swap();
        console.log(Swap Initiated, Transaction Hash: ${transactionResponse.hash});
        const receipt = await transactionResponse.wait();
        console.log(Swap Completed, Block Number: ${receipt.blockNumber});
    } catch (error) {
        console.error('Failed to execute swap', error);
    }
}

placeSwapOrder().catch(console.error);