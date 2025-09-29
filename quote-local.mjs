import { TokenClassKey, TokenBalance } from "@gala-chain/api";
import { quoteExactAmount, GetCompositePoolDto, QuoteExactAmountDto, DexFeePercentageTypes, CompositePoolDto, Pool, TickData, sqrtPriceToTick } from "@gala-chain/dex";
import { getPoolData } from "./query-api-queries.mjs";
import axios from "axios";
import BigNumber from "bignumber.js";

const QEA_URL = "https://gateway-mainnet.galachain.com/api/asset/dexv3-contract/QuoteExactAmount"
// const GCP_URL = "https://gateway-mainnet.galachain.com/api/asset/dexv3-contract/GetCompositePool"
const GCP_URL = "https://int-galachain-gateway-chain-platform-prod-chain-platform-eks.prod.galachain.com/api/asset/dexv3-contract/GetCompositePool"

const API_BASE_URL = "https://dex-backend-prod1.defi.gala.com";

async function performOfflineQuote(token0, token1, amount, fee, ) {
  // 2. Fetch composite pool data from chain
  const getCompositePoolDto = new GetCompositePoolDto(
    token0,
    token1,
    fee
  );

  // actually call the chain here with an axios POST request
  const compositePoolResponse = await axios.post(GCP_URL, getCompositePoolDto, {
    headers: {
      "Content-Type": "application/json",
    }
  });

  // temporarily construce the composite pool data via Query API calls
  const queryAPICompositePool = await getPoolData(token0.collection + "$" + token0.category + "$" + token0.type + "$" + token0.additionalKey, token1.collection + "$" + token1.category + "$" + token1.type + "$" + token1.additionalKey, fee);
  
  // Use GraphQL data (current and up-to-date)
  const foundPool = new Pool(
    queryAPICompositePool.pool.token0,
    queryAPICompositePool.pool.token1,
    queryAPICompositePool.pool.token0ClassKey,
    queryAPICompositePool.pool.token1ClassKey,
    queryAPICompositePool.pool.fee,
    new BigNumber(queryAPICompositePool.pool.sqrtPrice),
    queryAPICompositePool.pool.protocolFees
  );
  
  // Set the bitmap and liquidity from the GraphQL data
  foundPool.bitmap = queryAPICompositePool.pool.bitmap;
  foundPool.grossPoolLiquidity = new BigNumber(queryAPICompositePool.pool.grossPoolLiquidity);
  foundPool.liquidity = new BigNumber(queryAPICompositePool.pool.liquidity);
  foundPool.feeGrowthGlobal0 = new BigNumber(queryAPICompositePool.pool.feeGrowthGlobal0);
  foundPool.feeGrowthGlobal1 = new BigNumber(queryAPICompositePool.pool.feeGrowthGlobal1);
  foundPool.protocolFeesToken0 = new BigNumber(queryAPICompositePool.pool.protocolFeesToken0);
  foundPool.protocolFeesToken1 = new BigNumber(queryAPICompositePool.pool.protocolFeesToken1);
  
  // Use GraphQL data for tick data map
  const poolTicks = {};
  queryAPICompositePool.poolTicks.forEach(tick => {
    // Parse the JSON string in tick.node.value before creating TickData object
    const parsedTickValue = JSON.parse(tick.node.value);
    poolTicks[tick.node.key2] = parsedTickValue;
  });

  const poolToken0Balance = new TokenBalance({
    owner: queryAPICompositePool.poolBalances[0].node.owner,
    collection: queryAPICompositePool.poolBalances[0].node.collection,
    category: queryAPICompositePool.poolBalances[0].node.category,
    type: queryAPICompositePool.poolBalances[0].node.type,
    additionalKey: queryAPICompositePool.poolBalances[0].node.additionalKey
  });
  poolToken0Balance.quantity = new BigNumber(queryAPICompositePool.poolBalances[0].node.quantity);

  const poolToken1Balance = new TokenBalance({
    owner: queryAPICompositePool.poolBalances[1].node.owner,
    collection: queryAPICompositePool.poolBalances[1].node.collection,
    category: queryAPICompositePool.poolBalances[1].node.category,
    type: queryAPICompositePool.poolBalances[1].node.type,
    additionalKey: queryAPICompositePool.poolBalances[1].node.additionalKey
  });
  poolToken1Balance.quantity = new BigNumber(queryAPICompositePool.poolBalances[1].node.quantity);


  const compositePoolData = new CompositePoolDto(
    foundPool, 
    poolTicks,
    poolToken0Balance,
    poolToken1Balance,
    queryAPICompositePool.token0Decimals, 
    queryAPICompositePool.token1Decimals
  );

  // 3. Create quote request using composite pool data
  const quoteDto = new QuoteExactAmountDto(
    token0,
    token1,
    fee,
    amount, // 100 GALA
    true, // GALA -> GUSDC
    compositePoolResponse.data.Data // Use the fetched data for offline calculation
  );

  console.log("Composite Pool Data: ", JSON.stringify(compositePoolResponse.data.Data, null, 2));
  console.log("QL Composite Pool Data: ", JSON.stringify(compositePoolData, null, 2));

  // 4. Perform quote calculation locally
  const quoteResult = await quoteExactAmount(null, quoteDto);
  
  return quoteResult;
}

export async function performOnChainQuote(tokenIn, tokenOut, amountIn, fee) {
    const quoteResponse = await axios.get(`${API_BASE_URL}/v1/trade/quote`, {
        params: {
            tokenIn,
            tokenOut,
            amountIn,
            fee
        }
    });
    
    return quoteResponse.data.data;
}

export async function compareQuotes() {
    const token0 = new TokenClassKey()
    token0.collection = "GALA";
    token0.category = "Unit";
    token0.type = "none";
    token0.additionalKey = "none"; 
  
    const token1 = new TokenClassKey()
    token1.collection = "GUSDC";
    token1.category = "Unit";
    token1.type = "none";
    token1.additionalKey = "none";

    const fee = DexFeePercentageTypes.FEE_1_PERCENT;
    const amount = new BigNumber("1000"); 

    let localQuote = null;
    try {
        localQuote = await performOfflineQuote(token0, token1, amount, fee);
        console.log("Local Quote: ", JSON.stringify(localQuote, null, 2));
    } catch (error) {
        console.log("Local Quote Error: ", error.message);
    }

    const token0key = token0.collection + "$" + token0.category + "$" + token0.type + "$" + token0.additionalKey;
    const token1key = token1.collection + "$" + token1.category + "$" + token1.type + "$" + token1.additionalKey;

    const onChainQuote = await performOnChainQuote(token0key, token1key, amount.toString(), fee);
    console.log("On Chain Quote: ", JSON.stringify(onChainQuote, null, 2));

    return {
        localQuote,
        onChainQuote
    };

}

function main() {
    compareQuotes().then(result => {
        // console.log(result);
    });
}

main();