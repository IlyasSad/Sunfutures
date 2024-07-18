import {BigNumber, ethers} from 'ethers';
import {Subgraph, QueryParam, QueryResponse, TradeData, SynFuturesV3,PERP_EXPIRY} from '@synfutures/oyster-sdk';

async function main() {
    const sdk = SynFuturesV3.getInstance('blast');

    await sdk.init();

    const subgraphInstance = new Subgraph('https://api.synfutures.com/thegraph/v3-blast')

    // get your own signer

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

     const Result  =await calculateExecutionPrice(subgraphInstance, pair.symbol, PERP_EXPIRY,ethers.utils.parseUnits('20', 18) );
     console.log(Result)
}

async function calculateExecutionPrice(subgraph: Subgraph, instrumentAddr: string, expiry: number, size: BigNumber): Promise<BigNumber> {
    try {
        // Задаем параметры запроса
        const param: QueryParam = {
            instrumentAddr: instrumentAddr,
            expiry: expiry
        };

        // Получаем информацию о торговых данными
        const tradeData: QueryResponse = await subgraph.getOrdersToSettle(param);

        // Вычисляем цену исполнения путем агрегации цен из торговых данных
        let totalPrice = BigNumber.from(0);
        let totalSize = BigNumber.from(0);
        for (const data of tradeData) {
            const trader = data.trader;
            const ammExpiry = data.amm.expiry;
            // Проверяем, что данные соответствуют запрашиваемому инструменту и сроку экспирации
            if (instrumentAddr === trader && expiry === parseInt(ammExpiry)) {
                // Добавляем цену * размер к общей стоимости и размеру
                totalPrice = totalPrice.add(BigNumber.from(data.size).mul(BigNumber.from(data.size)));
                totalSize = totalSize.add(BigNumber.from(data.size));
            }
        }

        // Вычисляем среднюю цену исполнения
        const averagePrice = totalSize.isZero() ? BigNumber.from(0) : totalPrice.div(totalSize);
        return averagePrice;
    } catch (error) {
        console.error('Error calculating execution price:', error);
        throw error;
    }
}
main().catch(console.error);
