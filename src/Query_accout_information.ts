import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY } from '@synfutures/oyster-sdk';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    // Получаем адрес подписчика
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, sdk.ctx.provider);

    const instruments = await sdk.getAllInstruments();

    function getInstrumentBySymbol(symbol: string) {
        const instrument = instruments.find((i) => i.info.symbol === symbol);
        if (!instrument) {
            throw new Error('unknown symbol: ' + symbol);
        }
        return instrument;
    }

    const instrument = getInstrumentBySymbol('BTC-USDB-PYTH');

    // Получаем учетную запись пользователя
    const account = await sdk.getPairLevelAccount(await signer.getAddress(), instrument.info.addr, PERP_EXPIRY);

    console.log(
        `Position balance: ${ethers.utils.formatUnits(account.position.balance)}, size: ${ethers.utils.formatUnits(
            account.position.size,
        )}, entryNotional: ${ethers.utils.formatUnits(
            account.position.entryNotional,
        )}, entrySocialLossIndex: ${ethers.utils.formatUnits(
            account.position.entrySocialLossIndex,
        )}, entryFundingIndex: ${ethers.utils.formatUnits(account.position.entryFundingIndex, 18)}`,
    );

    for (const order of account.orders) {
        console.log(
            `Order id: ${order.oid}, size: ${ethers.utils.formatUnits(
                order.size,
                18,
            )}, balance: ${ethers.utils.formatUnits(order.balance, 18)}, tick: ${order.tick}, nonce: ${order.nonce}`,
        );
    }

    for (const range of account.ranges) {
        console.log(
            `Range id: ${range.rid}, size: ${ethers.utils.formatUnits(range.balance, 18)}, from: ${
                range.tickLower
            }, to: ${range.tickLower}`,
        );
    }//unrealizedFunding withdrawableBalance unrealizedFunding

    // Дополнительная информация о финансировании
    console.log(`Current funding: ${ethers.utils.formatUnits(account.position.unrealizedFundingFee, 18)}`);
    console.log(`Available withdrawal balance: ${ethers.utils.formatUnits(account.position.getMaxWithdrawableMargin(), 18)}`);
    console.log(`Liquidation price: ${ethers.utils.formatUnits(account.position.liquidationPrice, 18)}`);
    console.log(`Unrealized funding: ${ethers.utils.formatUnits(account.position.unrealizedFundingFee, 18)}`);
}

// ts-node src/demo.ts 0x0e038f13d9d5732223cf9b4b61eed264ccd44641
main().catch(console.error);
