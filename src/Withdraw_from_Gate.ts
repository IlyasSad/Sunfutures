//  Выйти из Gate
import { SynFuturesV3 } from '@synfutures/oyster-sdk';
import { ethers } from 'ethers';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    // get your own signer
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, sdk.ctx.provider);

    // get USDB token info
    const usdb = await sdk.ctx.getTokenInfo('USDB');

    await sdk.withdraw(signer, usdb.address, ethers.utils.parseUnits('10', usdb.decimals));

    console.log('Withdraw 10 USDB from the gate');
}

main().catch(console.error);