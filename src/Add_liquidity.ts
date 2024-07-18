import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY, TickMath } from '@synfutures/oyster-sdk';

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

    // update cache for signer
    await sdk.syncVaultCacheWithAllQuotes(await signer.getAddress());

    // margin to add liquidity
    const margin = ethers.utils.parseUnits('1000', 18);

    const result = await sdk.simulateAddLiquidity(
        await signer.getAddress(),
        {
            marketType: instrument.marketType,
            baseSymbol: instrument.info.base.symbol,
            quoteSymbol: instrument.info.quote.symbol,
        },
        PERP_EXPIRY,
        ethers.utils.parseUnits('1.8', 18), // alpha, liquidity range factor, 1.8 means ± 80%
        margin,
        100, // // slippage, 100 means 100 / 10000 = 1%
    );

    await sdk.addLiquidity(
        signer,
        {
            marketType: instrument.marketType,
            baseSymbol: instrument.info.base.symbol,
            quoteSymbol: instrument.info.quote.symbol,
        },
        PERP_EXPIRY,
        result.tickDelta,
        margin,
        result.sqrtStrikeLowerPX96,
        result.sqrtStrikeUpperPX96,
        Math.floor(Date.now() / 1000) + 300, // deadline, set to 5 minutes later
    );

    console.log(
        `Add 1000 USDB liquidity from tick ${TickMath.getTickAtSqrtRatio(
            result.sqrtStrikeLowerPX96,
        )} to tick ${TickMath.getTickAtSqrtRatio(result.sqrtStrikeUpperPX96)}`,
    );
}

main().catch(console.error);