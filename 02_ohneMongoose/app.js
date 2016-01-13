var express = require('express');
var app = express();
var http = require('http').Server(app);
var MongoClient = require('mongodb').MongoClient;

// Put the application on port 3000
http.listen(3000, function () {
    console.log('listening on port 3000');
});


// Database "test", Collection "autos"
var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function (err, db) {
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
        db.collection('autos').insert(multivan, function (err) {
            if (!err)console.log("Inserted a document into the autos collection.");
            if (callback) callback();
        });
    }

    // SELECT
    function selectCar(callback) {
        // SELECT modell, farbe FROM Auto WHERE marke = 'VW' (Auto -> DB Model)
        db.collection('autos').find(
            {marke: "VW"},            // WHERE ...
            {modell: 1, farbe: 1}).toArray(
            function (err, result) {
                if (!err) {
                    console.log('SELECTED:');
                    console.log(result);
                }
                if (callback) callback();
            }
        )
    }

    // 2. UPDATE
    function updateCar(callback) {
        // UPDATE Auto SET farbe = 'Gelb' WHERE modell = 'Scirocco';
        db.collection('autos').update(
            {modell: 'Multivan'},       // WHERE ...
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
        db.collection('autos').remove(
            {modell: "Multivan"},    // WHERE
            function (err) {
                if (!err) console.log("3. deleteCar");
                if (callback) callback();
            }
        )
    }

});

var multivan = {
    marke: "VW",
    modell: "Multivan",
    farbe: "Blau",
    baujahr: 2011,
    tuev: true,
    tags: ["Bulli", "gebraucht"],
    preis: 20000
};


