/*
TODO:

allow to change the global settings when starting the simulation (maxIrrigationDuration, etc)
show all the global settings
allow to set the data of the simulation



*/
console.log(new Date())
window.ONE_HOUR = 60*60*1000;
window.startDate = new Date('2016-09-25 00:00:00');
adjustDates();

$('button[data-scenario-run=true]').on('click', function(e){

    var scenarioId = $(e.target).attr('data-scenario-id');
    scenarioId = Number(scenarioId);
    var data = window.data[scenarioId];
    runScenario(data, scenarioId);
});



function runScenario(data, scenarioId){

    console.log('running scenario ' + scenarioId);

    reset();
    //debugger;
    //var _data = loadScenarioData(scenarioId);

    var selector = 'div[data-results=' + scenarioId + ']';
    $(selector).html('');

    data.forEach(function(readings){
        //debugger;
        // execute the model at a given instant
        execModel(readings);
        
        var html = [];
        html.push('<div>');
        html.push('<b>time:</b> ' + fecha.format(currentDate, 'YYYY-MM-DD HH:mm:ss') + ' ');
        if(irrigation === 'on'){
            html.push('<span style="color: green"><b style="margin-left: 10px;">status:</b> ' + irrigation + ' </span>');    
        }
        else{
            html.push('<b style="margin-left: 10px;">status:</b> ' + irrigation + ' ');    
        }
        html.push('<b style="margin-left: 10px;">info:</b> ' + info);
        html.push('</div>');

        $(selector).append(html.join(' '));
    });
};

function execModel(readings){

    //console.log(readings);
    
    currentDate = new Date(readings.ts);
    // case A - "rega está desligada" e "não vai chover"
    if (irrigation === 'off' && willRain(readings.prec) === false){

        // case A1 - "solo seco a 30cm" e "solo seco a 60cm"
        if (readings.wp_30 > refillPoint && readings.wp_60 > refillPoint){
            irrigation = 'on';
            info = 'A1';
            startIrrigationDate = new Date(readings.ts);
            stopIrrigationDate = undefined;
            return;
        }

        // case A2 - "solo seco a 30cm" e "solo húmido a 60cm" e "é de noite"
        else if (readings.wp_30 > refillPoint && readings.wp_60 <= refillPoint && isNight(readings.ts)){
            irrigation = 'on';
            info = 'A2';
            startIrrigationDate = new Date(readings.ts);
            stopIrrigationDate = undefined;
            return;
        }
    }

    // case B - "rega está ligada"
    else if (irrigation === 'on'){

        var irrigationDuration = readings.ts - startIrrigationDate;

        // case B1 - "solo encharcado a 30cm"
        if (readings.wp_30 < fieldCapacityPoint){
            irrigation = 'off';
            info = 'B1';
            startIrrigationDate = undefined;
            stopIrrigationDate = new Date(readings.ts);
            return;
        }

        // case B2 - "a duração máxima da rega foi atingida"
        else if (irrigationDuration > ONE_HOUR * maxIrrigationDuration){
            irrigation = 'off';
            info = 'B2';
            startIrrigationDate = undefined;
            stopIrrigationDate = new Date(readings.ts);
            return;
        }

        // case B3 - "vai chover"
        else if (willRain(readings.prec) === true){
            irrigation = 'off';
            info = 'B3';
            startIrrigationDate = undefined;
            stopIrrigationDate = new Date(readings.ts);
            return;
        }
    }
    info = 'none';
};

function loadScenarioData(scenarioId){

    var $table = $('table[data-scenario-id=scenarioId]');
    $table
};

function willRain(prec){

    if (prec >= window.minRain){
        return true;
    }

    return false;
};

function isNight(ts){

    if (ts.getHours() >= 19 && ts.getHours() <= 8){
        return true;
    }

    return false;
};

function reset(){
   
    window.fieldCapacityPoint = 9;
    window.refillPoint = 50;
    window.maxIrrigationDuration = 4;  // in hours
    window.minRain = 6;
    

    window.irrigation = "off";
    window.info = undefined;

    window.currentDate = undefined;
    window.startIrrigationDate = undefined;
    window.stopIrrigationDate = undefined;
};

function adjustDates(data){

    window.data.forEach(function(scenario){

        scenario.forEach(function(readings){

            var _ts = readings.ts;
            readings.ts = (new Date(startDate));
            readings.ts.setHours(_ts);
        });
    });

};

/*
return;
var i = 0;

var ONE_HOUR = 60*60*1000 - 1;
var irrigation = "off";
var maxThreshold = 50;
var minThreshold = 9;
var irrigationDuration = 4;
var startDate = new Date('2016-09-25 00:00:00');
var currentDate, startIrrigationDate, stopIrrigationDate;

function readWP(){

    // simulate a water potential reading
    var obj = data[i];
    //console.log(obj)

    currentDate = new Date(startDate);
    currentDate.setHours(startDate.getHours() + obj.ts);

    if(obj.wp_30 > maxThreshold){
        if(obj.wp_60 > maxThreshold){
            if(obj.prec < 10){
                startIrrigation();
            }    
        }
        else if(currentDate.getHours() >= 21 && currentDate.getHours() <= 6){
            if(obj.prec < 10){
                startIrrigation();
            }    
        }
    }

    if(obj.wp_30 < minThreshold){
        stopIrrigation();
    }

    if(startIrrigationDate){
        if(currentDate - startIrrigationDate > irrigationDuration*ONE_HOUR){
            stopIrrigation();
        }
    }


    var s = currentDate.toISOString();
    document.getElementById('content-1').innerHTML = s.substring(0, s.length - 5);
    document.getElementById('content-2').innerHTML = obj.wp_30;
    document.getElementById('content-3').innerHTML = obj.wp_60;
    document.getElementById('content-4').innerHTML = irrigation;

    if(irrigation==='on' && startIrrigationDate){
        document.getElementById('content-5').innerHTML = 'started on ' + startIrrigationDate.toISOString();
    }
    if(irrigation==='off' && stopIrrigationDate){
        document.getElementById('content-5').innerHTML = 'stopped on ' + stopIrrigationDate.toISOString();
    }
    i++;
    if(i < data.length){
        setTimeout(readWP, 1000)        
    }

}

function startIrrigation(){

    if(irrigation === "on"){

        return;
    }

    startIrrigationDate = new Date(currentDate.toISOString());    
    stopIrrigationDate = undefined;
    irrigation = "on";
}

function stopIrrigation(){

    if(irrigation === "off"){
        return;
    }
    
    startIrrigationDate = undefined;
    stopIrrigationDate = new Date(currentDate.toISOString());    
    irrigation = "off";
}
readWP();

*/