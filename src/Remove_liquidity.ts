import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY } from '@synfutures/oyster-sdk';

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

    // get user account
    const account = await sdk.getPairLevelAccount(await signer.getAddress(), instrument.info.addr, PERP_EXPIRY);

    const range = account.ranges[0];

    const result = sdk.simulateRemoveLiquidity(account, range, 100);

    await sdk.removeLiquidity(
        signer,
        instrument.pairs.get(PERP_EXPIRY)!,
        await signer.getAddress(),
        range,
        result.sqrtStrikeLowerPX96,
        result.sqrtStrikeUpperPX96,
        Math.floor(Date.now() / 1000) + 300, // deadline, set to 5 minutes later
    );

    console.log(
        `Remove ${ethers.utils.formatUnits(range.balance, 18)} USDB liquidity from tick ${range.tickLower} to tick ${
            range.tickUpper
        }`,
    );
}

main().catch(console.error);