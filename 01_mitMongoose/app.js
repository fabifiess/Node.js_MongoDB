var express = require('express');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var fs = require('fs');
//Models
var Auto = require(__dirname + '/models/automarken');

// Put the application on port 3000
http.listen(3000, function () {
    console.log('listening on port 3000');
});


// Database "test", Collection "autos"
mongoose.connect('mongodb://localhost:27017/test');


// models ausgelagert
fs.readdirSync(__dirname + '/models').forEach(function (filename) {
    if (~filename.indexOf('.js'))require(__dirname + '/models/' + filename);
});



var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected to DB");

    // explicit async order
    insertCar(function () {                       // 1. INSERT
        selectCar(function () {                   // SELECT
            updateCar(function () {               // 2. UPDATE
                selectCar(function () {           // SELECT
                    deleteCar(function () {       // 3. DELETE
                        selectCar(function () {   // SELECT
                            db.close();
                        })
                    })
                })
            })
        })
    });

    // 1. INSERT
    function insertCar(callback) {
        // INSERT INTO Autos ('marke', 'modell') VALUES ('VW', 'Golf');
        vw_scirocco.save(function (err) {
            if (!err)console.log("1. insertCar");
            if (callback) callback();
        })
    }

    // SELECT
    function selectCar(callback) {
        // SELECT modell, farbe FROM Auto WHERE marke = 'VW' (Auto -> DB Model)
        Auto.find(
            {marke: "VW"},            // WHERE ...
            {modell: 1, farbe: 1},    // SELECT ...
            function (err, result) {
                if (!err) console.log('SELECTED: ' + result);
                if (callback) callback();
            }
        )
    }

    // 2. UPDATE
    function updateCar(callback) {
        // UPDATE Auto SET farbe = 'Gelb' WHERE modell = 'Scirocco';
        Auto.update(
            {modell: 'Scirocco'},       // WHERE ...
            {$set: {farbe: "Gelb"}},    // SET ...
            {multi: true},
            function (err) {
                if (!err) console.log("2. updateCar");
                if (callback) callback();
            }
        )
    }

    // RENAME COLUMN funktioniert nur im Terminal:
    //ALTER TABLE autos CHANGE modell baureihe varchar(255) // WHERE marke = 'VW' nur über Umwege möglich
    //db.autos.update({marke:'VW'},{$rename: {'modell': 'baureihe'}}, false, true);

    // 3. DELETE
    function deleteCar(callback) {
        // DELETE FROM Autos WHERE modell = 'Scirocco';
        Auto.remove(
            {modell: "Scirocco"},
            function (err) {
                if (!err) console.log("3. deleteCar");
                if (callback) callback();
            }
        )
    }

});

var vw_scirocco = new Auto({
    marke: "VW",
    modell: "Scirocco",
    farbe: "Blau",
    baujahr: 2011,
    tuev: true,
    tags: ["Falsche Abgaswerte", "gebraucht"],
    preis: 20000
});

// show all entries of the collection auto on localhost:3000/autos
app.get('/autos', function (req, res) {
    mongoose.model('autos').find(function (err, autos) {
        res.send(autos);
    });
});