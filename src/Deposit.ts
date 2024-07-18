import { ethers } from 'ethers';
import { SynFuturesV3 } from '@synfutures/oyster-sdk';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');
    console.log(sdk.ctx.provider)

    // Создаем объект signer из кошелька с помощью приватного ключа
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, sdk.ctx.provider);

    // Получаем информацию о токене WETH
    const input_token = await sdk.ctx.getTokenInfo('USDB');

    // Проверяем, что токен существует и имеет адрес
    if (!input_token || !input_token.address) {
        throw new Error('Токен WETH не найден или не имеет адреса');
    }
    console.log('start funct')
    // Выполняем approve
    await sdk.ctx.erc20.approveIfNeeded(
        signer,
        input_token.address,
        sdk.config.contractAddress.gate,
        ethers.constants.MaxUint256,
    );
    console.log('end funct')

    // Выполняем deposit
    await sdk.deposit(signer, input_token.address, ethers.utils.parseUnits('30', 18));

    console.log('Deposit выполнен успешно!');
}

main().catch(console.error);
