import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY, Side } from '@synfutures/oyster-sdk';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    await sdk.init();

    // get your own signer
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, sdk.ctx.provider);

    const instruments = await sdk.getAllInstruments();

    // Проходим по всем инструментам и проверяем состояние блокировки
    for (const instrument of instruments) {
        try {
            const instrumentInfo = await sdk.getInstrumentInfo(instrument);
            if (instrumentInfo.) {
                console.log(`Стакан ${instrument.symbol} заблокирован.`);
            } else {
                console.log(`Стакан ${instrument.symbol} не заблокирован.`);
            }
        } catch (error) {
            console.error(`Ошибка при проверке состояния блокировки стакана ${instrument.symbol}:`, error);
        }
    }
}

// Вызываем функцию main
main();
