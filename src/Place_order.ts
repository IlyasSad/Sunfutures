import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY, Side, TickMath } from '@synfutures/oyster-sdk';

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

    const pair = instrument.pairs.get(PERP_EXPIRY)!;

    // update cache for signer
    await sdk.syncVaultCacheWithAllQuotes(await signer.getAddress());

    // we try to place a short order,
    // so the price of the order must be higher than the fair price
    const targetTick = pair.amm.tick + 100;

    // simulate result
    const result = sdk.simulateOrder(
        await sdk.getPairLevelAccount(await signer.getAddress(), instrument.info.addr, PERP_EXPIRY),
        targetTick,
        ethers.utils.parseEther('0.2'),
        Side.SHORT,
        ethers.utils.parseUnits('4', 18),
    );

    // place order
    await sdk.limitOrder(
        signer,
        pair,
        targetTick,
        ethers.utils.parseEther('0.2'),
        result.balance,
        Side.SHORT,
        Math.floor(Date.now() / 1000) + 300, // deadline, set to 5 minutes later
    );

    console.log(
        `Place a 4 leveraged limit order of 0.2 BTC at ${ethers.utils.formatUnits(
            TickMath.getWadAtTick(targetTick),
            18,
        )}`,
    );
}

main().catch(console.error);