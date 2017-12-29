# Crypto Balance

Get alerted when any new crypto appears on your preferred exchange.
Tested with gdax, bittrex, binance, and kucoin but will work with other exchanges supported by [cctx](https://github.com/ccxt/ccxt)


## Requirements
1. Node v7.7+ (author tested with 7.7.4)

## Usage

1. `git clone https://github.com/spinegar/crypto-alerts`
2. `cd crypto-alerts`
3. `npm install`
4. `cp config.example.js config.js`
5. For each exchange you use, add a new object to the exchange list with an `key` and `secret`.  Refer to <https://github.com/ccxt/ccxt> for properties needed for constructor.
   All the exchanges the author used just required `key` and `secret` as shown in the example config. Note: when creating api keys on each exchange the only permissions needed are read.  Don't allow withdrawal or trade for security.
6. run `node app.js`
7. Ideally, use PM2 or an alternative to ensure the process is always running.