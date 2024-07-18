import { SynFuturesV3 } from '@synfutures/oyster-sdk';
import {ethers} from "ethers";

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    await sdk.init();

    // get signer address
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, sdk.ctx.provider);

    console.log(
        'Account history:',
        await sdk.subgraph.getVirtualTrades({
            traders: [await signer.getAddress()],
        }),
    );
}

main().catch(console.error);