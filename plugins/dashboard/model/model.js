console.log(new Date())

var i = 0;

var ONE_HOUR = 60*60*1000 - 1;
var status = "off";
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
    document.getElementById('content-4').innerHTML = status;

    if(status==='on' && startIrrigationDate){
        document.getElementById('content-5').innerHTML = 'started on ' + startIrrigationDate.toISOString();
    }
    if(status==='off' && stopIrrigationDate){
        document.getElementById('content-5').innerHTML = 'stopped on ' + stopIrrigationDate.toISOString();
    }
    i++;
    if(i < data.length){
        setTimeout(readWP, 1000)        
    }

}

function startIrrigation(){

    if(status === "on"){
/*
        if(irrigationDuration && startIrrigationDate){
            //console.log(currentDate - startIrrigationDate)
            //console.log(irrigationDuration*ONE_HOUR)
            if(currentDate - startIrrigationDate > irrigationDuration*ONE_HOUR){
                stopIrrigation();
            }
        }
*/
        return;
    }

    startIrrigationDate = new Date(currentDate.toISOString());    
    stopIrrigationDate = undefined;
    status = "on";
}

function stopIrrigation(){

    if(status === "off"){
        return;
    }
    
    startIrrigationDate = undefined;
    stopIrrigationDate = new Date(currentDate.toISOString());    
    status = "off";
}
readWP();

