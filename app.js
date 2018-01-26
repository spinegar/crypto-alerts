const ccxt = require('ccxt');
const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const Crypto = require('./models/crypto');
const twilio = require('./lib/twilioHelper');
const config = require('./config');
const log4js = require('log4js');
log4js.configure({
    appenders: { logFile: { type: 'file', filename: 'log.txt' } },
    categories: { default: { appenders: ['logFile'], level: 'info' } }
});
const logger = log4js.getLogger('logFile');

let firstRun = false;

function main() {
    logger.info('Starting crypto alerts');
    connectDb().then(function() {
        Crypto.count({}).exec((err, coins) => {
            if(err) handleReject(err);

            if(!coins) {
                firstRun = true;
                console.log('Initiating first run. Alarms will not fire!');
                logger.info('Initiating first run. Alarms will not fire!');
            }

            processExchanges();
        });
    }).catch(handleReject);
}

function connectDb() {
    return new Promise(function(resolve, reject) {
        let url = 'mongodb://localhost/cryptoTrader';

        let options = {
            useMongoClient: true,
            autoIndex: false, // Don't build indexes
            reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
            reconnectInterval: 500, // Reconnect every 500ms
            poolSize: 10, // Maintain up to 10 socket connections
            // If not connected, return errors immediately rather than waiting for reconnect
            bufferMaxEntries: 0
        };

        mongoose.connection.once('open', function() {
            logger.info('MongoDB event open');
            logger.debug('MongoDB connected [%s]', url);

            mongoose.connection.on('connected', function() {
                logger.info('MongoDB event connected');
            });

            mongoose.connection.on('disconnected', function() {
                logger.warn('MongoDB event disconnected');
            });

            mongoose.connection.on('reconnected', function() {
                logger.info('MongoDB event reconnected');
            });

            mongoose.connection.on('error', function(err) {
                logger.error('MongoDB event error: ' + err);
            });

            return resolve();
        });

        mongoose.connect(url, options, function(err) {
            if (err) {
                reject(err);
            }
        });
    });
}

function processExchanges() {
    let exchanges = _.filter(config.exchanges, (exchange) => { return exchange.enabled; });

    Promise.each(exchanges, (exchange) => {
        processExchange(exchange);
    }).then(() => {
        if(firstRun) firstRun = false;

        logger.info('Finished.... running again shortly.');
        console.log('Finished.... running again shortly.');
        setTimeout(function(){
            processExchanges();
        }, 60000);
    }).catch(reject)
}

function processExchange(exchange) {
    return new Promise((resolve, reject) => {
        logger.info('Processing exchange ' + exchange.exchange);
        console.log('Processing exchange ' + exchange.exchange);
        fetchMarketsForExchange(exchange.exchange).then((markets) => {
            return new Promise.each(markets, (market) => {
                return processMarket(market, exchange);
            });
        }).then((markets) => {
            saveMarketsToDb(markets).then(resolve).catch(reject)
        }).catch(reject)
    })
}

function processMarket(market, exchange) {
    return new Promise((resolve, reject) => {
        _.extend(market, { exchange: exchange.exchange } );
        Crypto.findOne({id: market.id, exchange: market.exchange, isTrading: true}).exec((err, result) => {
            if(err) return reject(err);

            if(!_.isEmpty(result)) resolve();

            checkIfTrading(market).then((isTrading) => {
                if(isTrading) _.extend(market, { isTrading: true });

                resolve(market);
            }).catch(reject);
        });
    })
}

//todo - finish this method. check for active trades
function checkIfTrading(market) {
    return new Promise((resolve, reject) => {
        resolve(true);
    })
}

function saveMarketsToDb(markets) {
    return new Promise.each(markets, (market) => {
        return saveMarket(market);
    });
}

function saveMarket(market) {
    return new Promise((resolve, reject) => {
        Crypto.findOne({id: market.id, exchange: market.exchange}).exec((err, result) => {
            if(err) return reject(err);

            if(!result) {
                console.log('saving pair ' + market.id + ' to db');
                logger.info('saving pair ' + market.id + ' to db');
            }

            upsertCrypto(market).then(() => {
                if(!result && !firstRun) {
                    notifySubscribersListed(market).then(resolve).catch(reject);
                } else if( _.has(result, 'isTrading') && !result.isTrading && market.isTrading) {
                    notifySubscribersTrading(market).then(resolve).catch(reject);
                } else {
                    resolve();
                }
            }).catch(reject);
        });
    })
}

function notifySubscribersListed(market) {
    let msg = market + ' is now listed on ' + market.exchange;
    return notifySubscribers(msg);
}

function notifySubscribersTrading(market) {
    let msg = market + ' is now trading on ' + market.exchange;
    return notifySubscribers(msg);
}

function notifySubscribers(msg) {
    return Promise.all([
        notifyEmailSubscribers(msg),
        twilio.notifySmsSubscribers(msg),
        twilio.notifyVoiceSubscribers(msg)
    ])
}

function notifyEmailSubscribers() {
    return new Promise(function(resolve, reject) {
        if(_.get(config, 'notify.email.enabled', false) === false) return resolve();
        resolve();
    });
}

function upsertCrypto(update) {
    return new Promise((resolve, reject) => {
        Crypto.findOneAndUpdate({ id: update.id, exchange: update.exchange }, update, { upsert: true, new: true, setDefaultsOnInsert: true }, (err) => {
            if(err) return reject(err);
            logger.debug('Upserted ' + update.id + ' [' + update.exchange + '] to db');
            resolve(update);
        });
    });
}

function handleReject(err) {
    return new Promise(function(resolve, reject) {
        logger.error('Handling reject', JSON.stringify(err));
        process.exit(1);
        reject(err);
    });
}

function fetchMarketsForExchange(exchangeName) {
    return new Promise((resolve, reject) => {
        let exchange = new ccxt[exchangeName](config.exchanges[exchangeName]);
        exchange.loadMarkets().then((markets) => {
            resolve(_.map(markets, (market) => { return _.extend(market, { exchange: exchangeName }) }));
        }).catch(reject);
    });
}

if (module === require.main) {
    main();
}

module.exports = exports;