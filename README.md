# GalaChain Local Quote Tool

A Node.js application for comparing on-chain and offline DEX quotes on the GalaChain network. This tool validates local quote accuracy by fetching pool data from the GalaChain API and performing local quote calculations using the GalaChain DEX SDK, then comparing results with on-chain quotes to ensure consistency.

The script demonstrates how to construct composite pool data from API responses, convert string values to proper BigNumber objects, and perform offline quote calculations that match on-chain results. This enables developers to build applications that can calculate DEX quotes locally without requiring blockchain calls for every quote request.

## Quick Start - Using Local Quotes in Your App

```javascript
import { TokenClassKey, TokenBalance } from "@gala-chain/api";
import { quoteExactAmount, GetCompositePoolDto, QuoteExactAmountDto, CompositePoolDto, Pool, TickData } from "@gala-chain/dex";
import axios from "axios";
import BigNumber from "bignumber.js";

// 1. Fetch pool data from GalaChain
const getCompositePoolDto = new GetCompositePoolDto(token0, token1, fee);
const response = await axios.post("https://gateway-mainnet.galachain.com/api/asset/dexv3-contract/GetCompositePool", getCompositePoolDto);

// 2. Convert response data to proper objects with BigNumber conversions
const compositePoolData = createCompositePoolDtoFromResponse(response.data.Data);

// 3. Perform local quote calculation
const quoteDto = new QuoteExactAmountDto(token0, token1, fee, amount, zeroForOne, compositePoolData);
const quoteResult = await quoteExactAmount(null, quoteDto);

// Result: { amount0: "1000", amount1: "-14.366203", currentSqrtPrice: "...", newSqrtPrice: "..." }
```

## Features

- **Offline Quote Calculation**: Perform DEX quotes locally using pool data fetched from GalaChain
- **On-Chain Quote Comparison**: Compare local quotes with on-chain quotes from the DEX backend
- **Pool Data Fetching**: Retrieve comprehensive pool data including balances, ticks, and token decimals
- **GalaChain Integration**: Built specifically for GalaChain's DEX v3 protocol

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd local-quote
```

2. Install dependencies:
```bash
npm install
```

## Dependencies

- `@gala-chain/api` (v2.4.3) - GalaChain API SDK
- `@gala-chain/dex` (v1.0.18) - GalaChain DEX SDK
- `@gala-chain/gswap-sdk` (v0.0.7) - GalaChain GSwap SDK
- `axios` (^1.6.0) - HTTP client for API requests
- `bignumber.js` (^9.1.2) - Big number arithmetic
- `js-sha3` (^0.9.2) - SHA-3 hashing functions
- `typescript` (^5.6.3) - TypeScript support

## Usage

### Running the Application

Execute the main script to compare quotes:

```bash
node quote-local.mjs
```

This will:
1. Fetch pool data for GALA/GUSDC pair with 1% fee
2. Perform an offline quote calculation for 1000 GALA
3. Fetch the corresponding on-chain quote
4. Display both results for comparison

### Key Functions

#### `performOfflineQuote(token0, token1, amount, fee)`
Performs a local quote calculation using:
- Pool data fetched from GalaChain GraphQL API
- Composite pool data construction
- Local quote calculation using GalaChain DEX SDK

#### `performOnChainQuote(tokenIn, tokenOut, amountIn, fee)`
Fetches quotes from the on-chain DEX backend API.

#### `compareQuotes()`
Main comparison function that:
- Sets up GALA/GUSDC token pair
- Executes both offline and on-chain quotes
- Returns comparison results

### Pool Data Fetching

The `query-api-queries.mjs` module provides functions to fetch pool data:

- `getPoolData(token0Key, token1Key, fee)` - Main function to get complete pool data
- `getSpecificPool(token0Key, token1Key, fee)` - Fetch specific pool information
- `getTokenBalance(owner)` - Get token balances for a pool
- `getPoolTicks(poolHash)` - Fetch tick data for a pool
- `getTokenDecimals(tokenKey)` - Get decimal precision for tokens

## Configuration

### API Endpoints

The application uses several GalaChain endpoints:

- **GraphQL Query API**: `https://int-query-api-chain-platform-prod-chain-platform-eks.prod.galachain.com/graphql`
- **DEX Backend API**: `https://dex-backend-prod1.defi.gala.com`
- **Quote API**: `https://gateway-mainnet.galachain.com/api/asset/dexv3-contract/QuoteExactAmount`
- **Composite Pool API**: `https://int-galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com/api/asset/dexv3-contract/GetCompositePool`

### Token Configuration

Default tokens used in the comparison:
- **Token 0**: GALA (collection: "GALA", category: "Unit", type: "none", additionalKey: "none")
- **Token 1**: GUSDC (collection: "GUSDC", category: "Unit", type: "none", additionalKey: "none")
- **Fee**: 1% (DexFeePercentageTypes.FEE_1_PERCENT)
- **Amount**: 1000 GALA

## Project Structure

```
local-quote/
├── package.json              # Project dependencies and configuration
├── quote-local.mjs          # Main application logic and quote comparison
├── query-api-queries.mjs    # GraphQL queries and pool data fetching
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Development

### TypeScript Support

The project includes TypeScript as a dev dependency for type checking and development support.

### Error Handling

The application includes comprehensive error handling for:
- API request failures
- Pool data not found
- Invalid response formats
- Quote calculation errors

## API Integration

### GraphQL Queries

The application uses several GraphQL queries to fetch data:

1. **Pool Data Query**: Fetches specific pool information using token keys and fee
2. **Balance Query**: Retrieves token balances for pool addresses
3. **Tick Data Query**: Gets tick information for liquidity calculations
4. **Token Decimals Query**: Fetches decimal precision for tokens

### Data Flow

1. **Pool Identification**: Generate pool hash using token keys and fee
2. **Data Fetching**: Retrieve pool, balance, tick, and decimal data
3. **Composite Pool Construction**: Build complete pool data structure
4. **Quote Calculation**: Perform local quote using DEX SDK
5. **Comparison**: Compare with on-chain quote results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the GalaChain ecosystem. Please refer to GalaChain's licensing terms.

## Support

For issues and questions:
- Check the GalaChain documentation
- Review the DEX SDK documentation
- Open an issue in this repository
