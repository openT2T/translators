

var wh = require('./index');

wh.initWinkApi("endpoint (i.e. thermostats, binary_switches)","your device id","device access token, you'll get it after onboarding");

 wh.sendDesiredStateCommand("fieldtoWriteto","value you want to send, doesn't have to be string", function (error, result) 
{
    console.log(result); 
    
}); 

wh.getLastReading('fieldtoRead',function (error, result) //last reading fields are read-only
{
    console.log(result); 
    
});

wh.getValueOfDesiredState('fieldtoRead',function (error, result) //desired state fields are read and write, getting these values are separate from last reading
{
    console.log(result); 
    
});


