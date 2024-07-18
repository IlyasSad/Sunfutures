import { SynFuturesV3, PERP_EXPIRY } from '@synfutures/oyster-sdk';
import { ethers } from 'ethers';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    await sdk.init();

    // get your own signer
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

    const account = await sdk.getPairLevelAccount(await signer.getAddress(), instrument.info.addr, PERP_EXPIRY);

    const targetOrder = account.orders[0];

    await sdk.fill(signer, instrument.info.addr, {
        expiry: PERP_EXPIRY,
        tick: targetOrder.tick,
        target: await signer.getAddress(),
        nonce: targetOrder.nonce,
    });

    console.log('Fill order:', targetOrder.oid);
}

main().catch(console.error);