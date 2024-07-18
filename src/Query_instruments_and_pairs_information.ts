//Запрашивать информацию об инструментах и парах
import { ethers } from 'ethers';
import { InstrumentCondition, SynFuturesV3 } from '@synfutures/oyster-sdk';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    const instruments = await sdk.getAllInstruments();

    for (const instrument of instruments) {
        // only show instruments spot price in NORMAL condition
        if (instrument.state.condition === InstrumentCondition.NORMAL) {
            console.log(instrument.info.symbol, ethers.utils.formatEther(instrument.spotPrice));
        }
        // show all pairs symbol, mark price and fair price
        for (const [expiry, pair] of instrument.pairs) {
            console.log(
                pair.symbol,
                expiry,
                ethers.utils.formatEther(pair.markPrice),
                ethers.utils.formatEther(pair.fairPriceWad),
            );
        }
    }
}

// ts-node src/demo.ts
main().catch(console.error);