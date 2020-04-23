const express = require('express');
const router = express.Router();
const axios = require('axios');


var USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1/";
var search_endpoint = USDA_BASE_URL + "foods/search/?api_key=" + process.env.USDA_KEY;
// var individual_search_endpoint = USDA_BASE_URL + "/food/" + ""


router.post('/', (req, res, next) => {


    axios.post(search_endpoint, {query: req.body.query, pageSize: req.body.pageSize, pageNumber: req.body.pageNumber})
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
        console.log(error);
    });


});



//export such that module can be used in other files
module.exports = router;
