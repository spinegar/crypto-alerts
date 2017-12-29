module.exports = {
    //api creds for the marketplace you want to monitor and auto buy on
    exchanges: [
        {
            exchange: "bittrex",
            enabled: false,
            key: "",
            secret: ""
        },
        {
            exchange: "binance",
            enabled: false,
            key: "",
            secret: ""
        },
        {
            exchange: "gdax",
            enabled: false,
            key: "",
            secret: ""
        },
        {
            exchange: "kucoin",
            enabled: false,
            key: "",
            secret: ""
        }
    ],
    notify: {
        email: {
            mandrillKey: "",
            from: "",
            subscribers: [

            ]
        },
        voice: {
            twilioAccountSid: "",
            twilioAuthToken: "",
            from: "",
            url: "",
            subscribers: [

            ]
        },
        sms: {
            twilioAccountSid: "",
            twilioAuthToken: "",
            from: "",
            subscribers: [

            ]
        }
    }

};