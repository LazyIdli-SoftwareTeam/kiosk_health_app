const io = require('socket.io-client');
const os = require('os');
const wifi = require('node-wifi');
const ping = require('ping');
const fs = require('fs');
const { log } = require('console');


//constants
const socket = io('http://192.168.8.0:8000');
const KIOSKID = 'PTK-001';
const Url = 'youtube.com'
const logFilePath = 'error.log'

// creating a file and appending the error and at the time the error occured
function logError(error) {
    const logMessage = `${new Date().toISOString()} - Kios Id : ${KIOSKID} -${error}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}



// checking wifi and internet connection

function checkWifiAndInternet(){
    wifi.init();
    wifi.getCurrentConnections((error,currentConnections)=>{
        if (currentConnections.length === 0){
            console.log('Wifi is not connected:',error);
            return;
        }
        console.log('Wifi is connected:',currentConnections[0].ssid);
        ping.sys.probe(Url,(isAlive) =>{
            if (isAlive){
                console.log('Ping is successful')
            }else{
                console.log('Ping is failed')
            }
        });
    });
}

socket.on('connect', () => {
  wifi.init();
  console.log('connected');
  checkWifiAndInternet();
  setInterval(checkWifiAndInternet,20000)
});


function emitHealthData(){
    wifi.init();
    wifi.getCurrentConnections((error,currentConnections)=>{
        if (error){
            console.error('Errorretrieving Wifi connections',error);
            logError(error,KIOSKID)
            return;
        }
        const healthData = {
            wifi:currentConnections[0],
            kiosId :KIOSKID,
            time: new Date(),
            os:{
                uptime:os.uptime(),
                freeMem:os.freemem(),
                load:os.loadavg(),

            },

        };
        socket.emit('health',JSON.stringify(healthData));
        });
};

socket.on('connect',()=>{
    emitHealthData()
});

setInterval(emitHealthData,20000);


