const express = require('express');
const router = express.Router();
const axios = require('axios');


var USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1/";

router.post('/foods', (req, res) =>  {
    console.log( req.params.fdcids);
    var fdcids_string = "";
    req.params.fdcids.forEach( id => {
        fdcids_string = fdcids_string + "&fdcIds=" + id;
    });
    axios
        .get(USDA_BASE_URL + 'foods' + '/?api_key=' + process.env.USDA_KEY + fdcids_string)
        .then( response => response["data"]).then( data => {
            res.status(200).json({
                resultsDetailed: data
            });

        })
        .catch( error =>{
            res.status(500).json({
                error: error
            });

            console.log(error);
        });


});


router.get('/:fdcid', (req, res) => {
    axios
        .get(USDA_BASE_URL + 'food/' + req.params.fdcid + '/?api_key=' + process.env.USDA_KEY)
        .then( response => response["data"]).then( data => {

            var item_meets_requirements = true;
            var foodItem = {};
            // fdcId
            foodItem.fdcId = data["fdcId"];
            // description
            foodItem.description = data["description"];
            // brand( set to null by default)
            foodItem.brand = ""

            // logic for branded items
            if(data["dataType"] === 'Branded') {
                if(data["BrandOwner"] === undefined || data["servingSize"] === undefined || data["servingSize"] === undefined || data["servingSizeUnit"] === undefined || data["labelNutrients"]["calories"] === undefined) {
                    foodItem.brand = data["brandOwner"];
                    foodItem.servingSize = data["servingSize"];
                    foodItem.servingSizeUnit = data["servingSizeUnit"];
                    foodItem.calories = data["labelNutrients"]["calories"]["value"];

                     // check for serving size and unit and calories
                    if(data["servingSizeText"] !== undefined) {
                        foodItem.serving = "" + data["servingSizeText"] + "(" + data["servingSize"] + " " + data["servingSizeUnit"] + ")";
                    } else if(data["householdServingFullText"] !== undefined){
                        foodItem.serving = "" + data["householdServingFullText"] + "(" + data["servingSize"] + " " + data["servingSizeUnit"] + ")";
                    }else {
                        foodItem.serving = "" + data["servingSize"] + " " + data["servingSizeUnit"];
                    }


                    // used for cliet display
                    foodItem.topLeft = foodItem.description;
                    foodItem.bottomLeft = data["brandOwner"] + ', ' + foodItem.serving;
                    foodItem.bottomRight = foodItem.calories;

                } else {
                    item_meets_requirements = false;
                }
            }
            // brand
            if(item_meets_requirements === true) {
                res.status(200).json({
                    result: foodItem
                });
            } else {
                res.status(200).json({
                    result: null
                });
            }

        })
        .catch( error =>{
            res.status(500).json({
                error: error
            });

            console.log(error);
        });


});

router.post('/', (req, res) => {

    var dataTypes = [ 'Branded', 'SR Legacy'];
    axios.post(USDA_BASE_URL + "foods/search/?api_key=" + process.env.USDA_KEY, {query: req.body.query,  dataType: dataTypes, pageSize: req.body.pageSize, pageNumber: req.body.pageNumber})
    .then( response => response["data"]).then( data => {
        // get more detailed info
        var results = [];
        for(var i=0; i<req.body.pageSize;i++) {
            var currentResult = {};
            currentResult.fdcId = data["foods"][i]["fdcId"]
            currentResult.description = data["foods"][i]["description"]
            if( data["foods"][i]["brandOwner"] !== undefined) {
                currentResult.brand = data["foods"][i]["brandOwner"];
            }
            results.push(currentResult);
        }

        // console.log(data["foods"][1]["foodNutrients"]);
        console.log(results);




        res.status(201).json({
            totalHits: data["totalHits"],
            results: results

        });
    })
    .catch( error =>{


        res.status(500).json({
            error: error
        });

        console.log(error);
    });


});



//export such that module can be used in other files
module.exports = router;
