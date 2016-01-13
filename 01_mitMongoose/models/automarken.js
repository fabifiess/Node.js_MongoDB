var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var autoSchema = new Schema({
    marke: String,
    modell: String,
    farbe: String,
    baujahr: {type:Number,default:20000,min:1000,max:1000000},
    zulassung: {type: Date, default: Date.now},
    tuev: Boolean,
    preis:Number,
    tags:[Schema.Types.Mixed]
});

module.exports = mongoose.model('autos', autoSchema);