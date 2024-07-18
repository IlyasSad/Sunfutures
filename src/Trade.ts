import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY, Side } from '@synfutures/oyster-sdk';

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


    // inquire quotation and how much BTC is equivalent to 500 USDB
    const { baseAmount, quotation } = await sdk.inquireByQuote(pair, Side.LONG, ethers.utils.parseUnits('500', 18));
    // update cache for signer
    await sdk.syncVaultCacheWithAllQuotes(await signer.getAddress());

    // simulate result
    const result = sdk.simulateTrade(
        await sdk.getPairLevelAccount(await signer.getAddress(), instrument.info.addr, PERP_EXPIRY),

        quotation,
        Side.LONG,
        baseAmount,
        undefined, // we want to estimate the required margin, so pass in undefined here
        ethers.utils.parseUnits('7', 18), // leverage, precision is 18
        100, // slippage, 100 means 100 / 10000 = 1%
    );
    result.priceImpactWad
    //const tradeResult = sdk.simulateTrade(pairAccountModel, quotation, side, baseSize, margin, leverageWad, slippage);
    // trade
    await sdk.intuitiveTrade(

        signer,
        pair,
        Side.LONG,
        baseAmount,
        result.margin, // required margin
        result.tradePrice,
        100, // slippage, 100 means 100 / 10000 = 1%
        Math.floor(Date.now() / 1000) + 300, // deadline, set to 5 minutes later

    );

    console.log(
        `Open a long position of ${ethers.utils.formatEther(
            baseAmount,
        )} BTC(≈ 500 USDB) with ${ethers.utils.formatUnits(result.margin, 18)} USDB and ${ethers.utils.formatUnits(
            result.leverageWad,
        )} leverage`,
    );
}

main().catch(console.error);
