var express = require('express');
var app = express();
var http = require('http').Server(app);
var MongoClient = require('mongodb').MongoClient;
var util = require('util'); // print all entries in nested objects

// Put the application on port 3000
http.listen(3000, function () {
    console.log('listening on port 3000');
});


// Database "test", Collection "autos"
var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function (err, db) {
    console.log("Connected to DB");

    // explicit async order
    db.collection('autos').drop(function () {
        db.collection('dealers').drop(function () {
            db.collection('awards').drop(function () {
                basicQueries(function () {
                    mongoJoins(function () {
                        db.close(function () {
                            console.log("DB closed");
                        })
                    })
                })
            })
        })
    })


    function basicQueries(callback) {
        insertCar(function () {                       // 1. INSERT
            selectCar(function () {                   // SELECT
                updateCar(function () {               // 2. UPDATE
                    selectCar(function () {           // SELECT
                        deleteCar(function () {       // 3. DELETE
                            selectCar(function () {   // SELECT
                                if (callback) callback();
                            });
                        })
                    })
                })
            })
        });

        // 1. INSERT
        function insertCar(callback) {
            // INSERT INTO autos ('marke', 'modell') VALUES ('VW', 'Golf');
            db.collection('autos').insert(multivan, function (err) {
                if (!err)console.log("1. Inserted a document into the autos collection.");
                if (callback) callback();
            });

        }

        // 2. UPDATE
        function updateCar(callback) {
            // UPDATE autos SET farbe = 'Gelb' WHERE modell = 'Scirocco';
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
            // DELETE FROM autos WHERE modell = 'Scirocco';
            db.collection('autos').remove(
                {modell: "Multivan"},    // WHERE
                function (err) {
                    if (!err) console.log("3. deleteCar");
                    if (callback) callback();
                }
            )
        }

        // SELECT
        function selectCar(callback) {
            // SELECT modell, farbe FROM autos WHERE marke = 'VW' (Auto -> DB Model)
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
    }

    function mongoJoins(callback) {

        insertMoreCars(function () {  // 1. INSERT more cars
            //selectCar(function () {   // SELECT
            join1(function () {   // 2. imitate SQL JOINs
                showResult(function () {
                    if (callback) callback();
                })
            })
            //})
        })

        // 1. INSERT more cars
        function insertMoreCars(callback) {
            // INSERT INTO autos ('marke', 'modell') VALUES ('VW', 'Golf');
            db.collection('autos').insert([polo, adam], function (err) {
                if (!err)console.log("1. Inserted more documents into the autos collection.");
                db.collection('dealers').insert([dealer1, dealer2], function (err) {
                    if (!err)console.log("2. Inserted documents into the dealers collection.");
                    db.collection('awards').insert([award1, award2], function (err) {
                        if (!err)console.log("3. Inserted documents into the awards collection.");
                        if (callback) callback();
                    });
                });
            });
        }



        function join1(callback) {
            var joinedObjects_array = [];


            joinObj(function () {

                console.log("\njoinedObjects_array in callback function");
                console.log(util.inspect(joinedObjects_array, {showHidden: false, depth: null}));

            });

            function joinObj(callback) {
                db.collection('autos').find({}, {_id: 1, awards: 1}).forEach(function (newCar) {
                    var joined = [];
                    for (var i = 0; i < newCar.awards.length; i++) {
                        (function () {
                            var j = i;
                            db.collection('awards').find({_id: newCar.awards[j]}).toArray(function (err, results) {
                                joined.push(results[0]);

                                if (j == newCar.awards.length - 1 && i < 11) {
                                    newCar.awards = joined;
                                    joinedObjects_array.push(newCar);
                                    if (callback)callback(true); //ready
                                }
                            });
                        })();
                    }
                });
            }
        }

        function showResult(callback) {
            //console.log("joinedObjs2: ");
            //console.log(joinedObjs);
            if (callback)callback();
        }


        // SELECT
        function selectCar(callback) {
            // SELECT modell, farbe FROM autos WHERE marke = 'VW' (Auto -> DB Model)
            db.collection('autos').find(
                {},                      // WHERE ...
                {modell: 1, farbe: 1, similarCars: 1}).toArray(
                function (err, result) {
                    if (!err) {
                        console.log('SELECTED:');
                        console.log(result);
                    }
                    if (callback) callback();
                }
            )
        }



    }

});

var multivan = {
    _id: "c1", // muss nicht zwingend angegeben werden, ansonsten:  "_id": ObjectID("568f7397d8629deb04edf396") o. Ä
    marke: "VW",
    modell: "Multivan",
    farbe: "Blau",
    baujahr: 2011,
    tuev: true,
    tags: ["Bulli", "liebling von allen"],
    preis: 20000,
    awards: ["a1"]
};

var polo = {
    _id: "c2",
    marke: "VW",
    modell: "Polo",
    farbe: "Orange",
    baujahr: 2006,
    tuev: true,
    tags: ["Kult"],
    preis: 15000,
    similarCars: ["c3, c4"],
    awards: ["a1"],
    dealer: ["dealer1", "dealer2"]
};

var adam = {
    _id: "c3",
    marke: "Opel",
    modell: "Adam",
    farbe: "Braun",
    baujahr: 2016,
    tuev: true,
    tags: ["hoppelt noch nicht"],
    preis: 9000,
    similarCars: {
        $ref: "autos",
        $id: ["c1", "c2"],
        $db: "test"
    }, // Kurzform: DBRef("autos", "01,02", "test");
    dealer: ["dealer1"],
    awards: ["a2", "a1"]
};

var dealer1 = {
    _id: "d1",
    name: "Autohaus Maier",
    town: "Stuttgart"
};

var dealer2 = {
    _id: "d2",
    name: "Gebrauchtwagen-Schneider",
    town: "Ludwigsburg"
};

var award1 = {
    _id: "a1",
    title: "Cult",
    date: new Date("2015-12-01"),
    available: Date.now
};

var award2 = {
    _id: "a2",
    title: "Historic",
    older_than: new Date("1960-01-01"),
};

