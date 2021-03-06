// taken from the waitFor example:
// https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */

"use strict";

var webpage = require('webpage');
var fs = require('fs');

var meteoUrl = "http://meteo.tecnico.ulisboa.pt/forecast/coordinates/lon/-9.15/lat/38.73";
var data;
var page = webpage.create();
var ten_seconds = 10*1000;

page.open(meteoUrl, function (status) {

    // Check for page load success
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit();
    } 

    var testData = function() {

        data = page.evaluate(function() {
            return window.mgdata;
        });

        return !!data;
    };

    var onReady = function() {

       var filename = new Date().toISOString() + ".json";
       //console.log("data was saved in: " + filename);
       //fs.write(fs.workingDirectory + "/" + filename, JSON.stringify(data, null, 4), 'w');
       console.log(JSON.stringify(data, null, 4))

       phantom.exit();
    };

    waitFor(testData, onReady, ten_seconds);
});

function waitFor(testFx, onReady, timeOutMillis) {

    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.error("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 1000); //< repeat check every 250ms
}
