const _ = require('lodash');
const config = require('./../config');
const log4js = require('log4js');
const Promise = require('bluebird');
log4js.configure({
    appenders: { logFile: { type: 'file', filename: '../log.txt' } },
    categories: { default: { appenders: ['logFile'], level: 'info' } }
});
const logger = log4js.getLogger('logFile');

exports.notifySmsSubscribers = function(body) {
    let subscribers =_.get(config, 'notify.sms.subscribers', []);
    if(_.isString(subscribers)) subscribers = [subscribers];

    return Promise.each(subscribers, (subscriber) => {
        return new Promise((resolve, reject) => {
            if(!_.get(config, 'notify.sms.enabled', false)) return resolve();

            logger.info('Sending SMS to ' + subscriber);
            let client = require('twilio')(_.get(config, 'notify.sms.twilioAccountSid'), _.get(config, 'notify.sms.twilioAuthToken'));
            client.messages.create({
                to: subscriber,
                from: _.get(config, 'notify.sms.from', ''),
                body: body
            }, (err) => {
                if(err) {
                    logger.error('SMS failed to ' + subscriber, err);
                    return reject(err);
                }

                logger.info('SMS successfully sent to ' + subscriber);
                resolve();
            });
        });
    });
};

exports.notifyVoiceSubscribers = function(body) {
    let subscribers =_.get(config, 'notify.voice.subscribers', []);
    if(_.isString(subscribers)) subscribers = [subscribers];

    return Promise.each(subscribers, (subscriber) => {
        return new Promise((resolve, reject) => {
            if(!_.get(config, 'notify.voice.enabled', false)) return resolve();

            logger.info('Sending SMS to ' + subscriber);
            let client = require('twilio')(_.get(config, 'notify.sms.twilioAccountSid'), _.get(config, 'notify.sms.twilioAuthToken'));
            client.calls.create({
                to: subscriber,
                from: _.get(config, 'notify.voice.from', ''),
                body: body,
                url: _.get(config, 'notify.voice.url', 'http://demo.twilio.com/docs/voice.xml'),
            }, (err) => {
                if(err) {
                    logger.error('Call failed to ' + subscriber, err);
                    return reject(err);
                }

                logger.info('Call successful to ' + subscriber);
                resolve();
            });
        });
    });
};

module.exports = exports;