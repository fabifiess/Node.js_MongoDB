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
            join(join_instructions, function () {   // 2. imitate SQL JOINs
                if (callback) callback();
            })
        })

        // 1. INSERT more cars
        function insertMoreCars(callback) {
            // INSERT INTO autos ('marke', 'modell') VALUES ('VW', 'Golf');
            db.collection('autos').insert([polo, adam], function (err) {
                if (!err)console.log("1. Inserted more documents into the autos collection.");
                db.collection('dealers').insert([dealer1, dealer2, dealer3], function (err) {
                    if (!err)console.log("2. Inserted documents into the dealers collection.");
                    db.collection('awards').insert([award1, award2], function (err) {
                        if (!err)console.log("3. Inserted documents into the awards collection.");
                        if (callback) callback();
                    });
                });
            });
        }


        var join_instructions = {
            "autos": {
                "dealers": "dealers", // Field_of_mainObject : name_of_subobject_to_be_nested_into_mainObject
                "awards": "awards"
            }
        }

        function join(join_instructions, callback) {
            // parse JSON
            var mainCollection_name = Object.keys(join_instructions)[0]; // "autos"
            var mainCollection_content = join_instructions[mainCollection_name]; // { awards: 'awards', dealers:
                                                                                 // 'Carseller' }
            var subObject_placeholders = Object.keys(join_instructions[mainCollection_name]); // ["awards","dealers"]
            // -> left from
            // ':' (Placeholders in main object)

            console.log("\n1. subObject_placeholders");
            console.log(subObject_placeholders);
            console.log("2. subObject_placeholders.length");
            console.log(subObject_placeholders.length);

            var subObject_collectionNames = [];
            for (var i = 0; i < subObject_placeholders.length; i++) {

                subObject_collectionNames[i] = mainCollection_content[subObject_placeholders[i]]; // objectValues ->
                // ["awards","dealers"]
                // ->
                // right from ':' (coll. name of subobject)

                console.log("3. Name of the collection " + i + " where the subobject is saved in (according to JSON)");
                console.log(subObject_collectionNames[i]);
            }

            nestObjects(function (nestedObjects) {
                console.log("\n*+*+*+*+*+\n13. Whole Object:\n*+*+*+*+*+\n");
                console.log(util.inspect(nestedObjects, {
                    showHidden: false,
                    depth: null
                }));
                if (callback)callback(nestedObjects);
            });

            function nestObjects(callback) {
                db.collection(mainCollection_name).find({}, {
                    _id: 1,
                    dealers: 1,
                    awards: 1
                }).toArray(function (err_mainObject, mainObjects) {
                    if (err_mainObject)console.log("Could not read from main object");
                    if (!err_mainObject) {
                        var remedial_mainObjects = [];
                        for (var g = 0; g < mainObjects.length; g++) {
                            (function () {
                                var mainObject_pos = g;
                                console.log("\n---------------\n4. mainObject number: " + mainObject_pos + "\n---------------");
                                var currentMainObject = mainObjects[mainObject_pos];
                                console.log("\n5. currentMainObject (" + mainObject_pos + "): ");
                                console.log(currentMainObject);
                                console.log("\n6. subObject_placeholders (at main object " + mainObject_pos + "): (according to JSON): " + subObject_placeholders);
                                console.log("\n**********\n7. schleife\n**********\n");

                                var joined_subObjects = [];
                                for (var x = 0; x < subObject_placeholders.length; x++) {
                                    (function () {
                                        var l = x;
                                        console.log("7.1. subObject_placeholders[" + l + "]: " + subObject_placeholders[l]);
                                        var current_subObject_placeholderooo = subObject_placeholders[l]; // e. g.
                                                                                                          // "dealers"
                                        // or "awards"
                                        console.log("8. current_subObject_placeholders at main object " + mainObject_pos + ": (according to main object): " + current_subObject_placeholderooo); // [ 'd1', 'd2' ]
                                        var current_subObject_placeholders = currentMainObject[current_subObject_placeholderooo/*[mainObject_pos]*/]; // e. g. currentMainObject['dealers'] -> d1,d2
                                        console.log("Values of the object '" + subObject_placeholders[l] + "': " + current_subObject_placeholders); // e. g. d1,d2

                                        for (y = 0; y < current_subObject_placeholders.length; y++) {
                                            (function () {
                                                var z = y;
                                                //var subObject_pos = l;

                                                var oneOfTheSubObjects = current_subObject_placeholders[z]; // e. g.
                                                                                                            // 'd1'
                                                                                                            // or//
                                                                                                            // 'd2'
                                                console.log("Extracted values of the main object " + mainObject_pos + "'s sub object '" + subObject_placeholders[l] + "': " + oneOfTheSubObjects); // e. g. 'd1' or 'd2'
                                                console.log("Going to look up collection " + l + " ('" + subObject_collectionNames[l] + "')"); // e. g. dealers or awards

                                                fetchASubObject();
                                                function fetchASubObject() {
                                                    // z. B. db.collection('dealers').find({_id: 'd1'}).toArray(function
                                                    // (err_subObject, subObjects) {
                                                    db.collection(subObject_collectionNames[l]).find({_id: oneOfTheSubObjects}).toArray(function (err_subObject, subObjects) {
                                                        if (err_subObject)console.log("Could not read from sub object");
                                                        if (!err_subObject) {
                                                            joined_subObjects.push(subObjects[0]);

                                                            //console.log("\n10. Main Object " + mainObject_pos + " /
                                                            // SubObject " + l + " ('" + subObject_collectionNames[l] +
                                                            // "'): Pushed to joined_subobjects array: ");
                                                            // console.log(subObjects[0]); // e. g. { _id: 'd1', name:
                                                            // 'Autohaus Maier', town: 'Stuttgart' }

                                                            //console.log("\njoined_subObjects: ");
                                                            //console.log(joined_subObjects);

                                                            //var maxZ = current_subObject_placeholders.length - 1;
                                                            //console.log("z ist " + z + " (max length of subobject
                                                            // (array) ('" + subObject_collectionNames[l] + "'): " +
                                                            // maxZ + ")");

                                                            if (z == current_subObject_placeholders.length - 1 /*&& l == subObject_placeholders.length - 1*/) { // parsed every subobject at the given field of the main object


                                                                currentMainObject[current_subObject_placeholderooo] = joined_subObjects;
                                                                joined_subObjects = [];

                                                                //console.log("\nremedial_mainObjects");
                                                                //console.log(util.inspect(remedial_mainObjects, {
                                                                //    showHidden: false,
                                                                //    depth: null
                                                                //}));

                                                                //console.log("\n11. Main Object " + mainObject_pos + "
                                                                // / SubObject " + l + " ('" +
                                                                // subObject_collectionNames[l] + "'): All sub objects
                                                                // been read."); console.log("joined_subObjects: ");
                                                                // console.log(joined_subObjects);

                                                                if (l == subObject_placeholders.length - 1) {
                                                                    remedial_mainObjects.push(currentMainObject);
                                                                    // console.log("\nüüüüüüüüüüüüüü\njoined_subObjects:");
                                                                    // console.log(joined_subObjects);
                                                                    if (mainObject_pos == mainObjects.length - 1) {
                                                                        if (callback)callback(remedial_mainObjects);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            })();
                                        }
                                    })();
                                }
                            })();
                        }
                    }
                });
            }
        }
    }
});

var multivan = {
    _id: "c1",
    marke: "VW",
    modell: "Multivan",
    farbe: "Blau",
    baujahr: 2011,
    tuev: true,
    tags: ["Bulli", "Retro"],
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
    dealers: ["d1", "d2"]
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
    similarCars: ["c1", "c2"],
    awards: ["a2"],
    dealers: ["d1"]
};

var dealer1 = {
    _id: "d1",
    name: "Auto Maier",
    town: "Stuttgart"
};

var dealer2 = {
    _id: "d2",
    name: "Used Cars",
    town: "Lubu"
};

var dealer3 = {
    _id: "d3",
    name: "Mafia",
    town: "San Juán"
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