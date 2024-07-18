import { ethers } from 'ethers';
import { SynFuturesV3, PERP_EXPIRY, Side, PositionModel } from '@synfutures/oyster-sdk';

async function closePosition() {
    const sdk = SynFuturesV3.getInstance('blast');
    await sdk.init();

    // Получите ваш собственный подписчик (ваш кошелек)
    const signer = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY as string, sdk.ctx.provider);

    // Получите все доступные инструменты
    const instruments = await sdk.getAllInstruments();

    // Функция для получения инструмента по символу
    function getInstrumentBySymbol(symbol: string) {
        const instrument = instruments.find((i) => i.info.symbol === symbol);
        if (!instrument) {
            throw new Error('unknown symbol: ' + symbol);
        }
        return instrument;
    }

    // Получите инструмент по его символу (например, BTC-USDB-PYTH)
    const instrument = getInstrumentBySymbol('BTC-USDB-PYTH');

    // Получите пару для заданного срока
    const pair = instrument.pairs.get(PERP_EXPIRY)!;
    await sdk.syncVaultCacheWithAllQuotes(await signer.getAddress())
    // Получите информацию о вашей текущей позиции
    const account = await sdk.getPairLevelAccount(signer.address, instrument.info.addr, PERP_EXPIRY);
    const positionSize = account.position.size;


    // Определите сторону сделки в зависимости от размера позиции (покупка или продажа)
    const side = positionSize.isNegative() ? Side.LONG : Side.SHORT;

    // Получите текущий уровень плеча в открытой позиции
    const leverage =  sdk.inquireLeverageFromTransferAmount(
        account.position,
        true, // Передаем true, так как мы хотим узнать уровень плеча для входящего перевода
        positionSize.abs() // Размер перевода равен абсолютной величине текущей позиции
    );
    const new_lev = parseInt(leverage.toString()) / Math.pow(10, 18);

    // Используйте значение уровня плеча в формате BigNumber
    console.log("Текущий уровень плеча:", new_lev.toString());

    // Определите базовый актив для закрытия позиции
    const {baseAmount, quotation  } = await sdk.inquireByQuote(pair, side, positionSize.abs());

    // Симулируйте сделку для закрытия позиции
    const result = sdk.simulateTrade(
        await sdk.getPairLevelAccount(await signer.getAddress(), instrument.info.addr, PERP_EXPIRY),
        quotation,
        side,
        baseAmount, // Используйте количество базового актива для закрытия позиции
        undefined,
        leverage, // Используем уровень плеча, определенный выше
        100 // slippage
    );

    // Выполните сделку для закрытия позиции
    await sdk.intuitiveTrade(
        signer,
        pair,
        side,
        positionSize.abs(),
        result.margin.abs(),
        result.tradePrice,
        100, // slippage
        Math.floor(Date.now() / 1000) + 300 // deadline, установите на 5 минут позже
    );

    console.log(`Позиция закрыта: ${ethers.utils.formatEther(positionSize)} BTC`);
}

closePosition().catch(console.error);
