var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cryptoSchema = new Schema({
    base: String,
    id: String,
    exchange: String,
    info: Object,
    limits: Object,
    maker: Number,
    percentage: Boolean,
    precision: Object,
    quote: String,
    symbol: String,
    take: Number,
    isTrading: { type: Boolean, default: false },
    tierBased: Boolean,
    created_at: Date,
    updated_at: Date,
    listed_at: Date
});

cryptoSchema.pre('save', function(next) {
    var currentDate = new Date();

    this.updated_at = currentDate;

    if (!this.created_at)
        this.created_at = currentDate;

    next();
});

var Crypto = mongoose.model('Crypto', cryptoSchema);

module.exports = Crypto;

