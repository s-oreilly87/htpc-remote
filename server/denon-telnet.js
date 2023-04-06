//   This is a modified version of marantz-denon-telnet.

//   Uses telnet-stream module, instead of telnet-client (maybe a bad choice)

//   Behaviour was changed so that connection remains open and picks up emitted events that aren't a direct response to a command

//   Code was cleaned up to my IDE's liking,  ES6 syntax (var -> const/let, () => {}, etc.)

//   In its current state . . .
//      - nothing is done with EVENTS.
//      - RESPONSES arent quite working because I cant remove listeners from the TelnetSocket . . . they just pile up

import net from 'net'
import {TelnetSocket} from 'telnet-stream'
import DenonTelnetWrapper from './denon-telnet-wrapper.js'

const DENON_PORT = 23

/**
 Returns an instance of DenonTelnet that can handle telnet commands to the given IP.
 @constructor
 @param {string} ip Address of the AVR.
 */
const DenonTelnet = function(ip) {
    this.params = {
        port: DENON_PORT,
        host: ip,
        //keepAlive: true,
        //keepAliveInitialDelay: true
        //setNoDelay: true,
        timeOut: 300000, // 5m timeout on inactive connection NOT response
    }
    this.connection = null
    this.busy = false
    this.cmdQueue = []
    this.receivedData = []
    this.timeoutWatcher = null
    this.multipleDataTimeout = 100
    this.responseTimeout = 3000

    this.currentCmdHandler = null

};


DenonTelnet.prototype.connect = function() {
    // create a socket connection (And connects it!)
    try {
        const socket = net.createConnection(this.params, () => {
            console.log("Telnet Socket created and connected!")
            // once connected, go back and start working through the queue
            this.sendNextTelnetQueueItem()
        })
        const telnetSocket = new TelnetSocket(socket)

        // create listener to forward the 'data' event to wrapper
        telnetSocket.on('data', (data) => {
            this.connection.emit('data', data);
        });

        telnetSocket.on('close', () => {
            console.log("TelNet connection closed!")
        })

        // Wrap telnetSocket to allow removing listeners / once
        this.connection = DenonTelnetWrapper(telnetSocket)
    } catch (err) {
        console.error('DENON-TELNET: Telnet Connection Error:');
        console.error(err)
    }

    // // default data listener for logging (doesnt send response)
    // this.connection.on('data', (data) => {
    //     let cleanedData = data.toString().trim().split('\r')
    //     this.receivedData.push(...cleanedData)
    //     clearTimeout(this.timeout)
    //
    //     this.timeout = setTimeout(() => {
    //         console.log(`Received data: `);
    //         console.log(this.receivedData)
    //         this.receivedData = []
    //     }, this.responseTimeout)
    // })


}



DenonTelnet.prototype.setDataHandlerCallback = function(callback) {
    this.currentCmdHandler = (data) => {
        clearTimeout(this.timeoutWatcher)
        let cleanedData = data.toString().trim().split('\r')
        this.receivedData.push(...cleanedData)

        // Once theres a gap of this.multipleDataTimout, Response is complete
        this.timeoutWatcher = setTimeout(() => {
            this.connection.removeListener('data', this.currentCmdHandler)
            this.currentCmdHandler = null

            if (this.receivedData.length > 0) { // has to be, there was a data event
                //console.log(`Received data: `);
                //console.log(this.receivedData)
                callback(null, this.receivedData)
                this.receivedData = []
            } else {
                callback("Error")
            }
        }, this.multipleDataTimeout)
    }

    this.connection.on('data', this.currentCmdHandler)
}

DenonTelnet.prototype.sendNextTelnetQueueItem = function() {
    if (this.cmdQueue.length > 0) {
        if (!this.connection) {
            this.connect()
        } else {
            const item = this.cmdQueue.shift();
            this.setDataHandlerCallback(item.callback)
            //console.log("Writing cmd: " + item.cmd)
            this.connection.write(item.cmd + "\r")

            // timeout for no response (will be cleared in data handler on data)
            this.timeoutWatcher = setTimeout(() => {
                this.connection.removeListener('data', this.currentCmdHandler)
                item.callback("No Response")
            }, this.responseTimeout)

            //TODO: need to figure out a way to wait until prev res sent to send another command ... i think?

            setTimeout(() => {  // Send the COMMAND in 50ms or more intervals.
                this.sendNextTelnetQueueItem();
            }, 50);
        }
    } else {
        this.busy = false
        //console.log("Queue empty - awaiting more commands!")
    }
};



/**
 Low level method to add a command to the Telnet queue.
 @param {string} cmd Telnet command
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {?RegExp} waitfor Wait for this regexp to fulfill instead of a timeout.
 */
DenonTelnet.prototype.addCmdToQueue = function(cmd, callback, waitfor=undefined) {
    this.cmdQueue.push({ cmd: cmd, callback: callback, waitfor: waitfor })
    if (!this.busy) {
        this.busy = true
        this.sendNextTelnetQueueItem();
    }
};



/**
 Send raw Telnet codes to the AVR.
 @see marantz Telnet Reference {@link http://www.us.marantz.com/DocumentMaster/US/Marantz_FY16_AV_SR_NR_PROTOCOL_V01(2).xls}
 @param {string} cmd Telnet command
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.cmd('PW?', function(error, data) {console.log('Power is: ' + data);});
 // Power is: [PWON,Z2ON,Z3ON|PWSTANDBY]
 */
DenonTelnet.prototype.cmd = function(cmd, callback) {
    this.addCmdToQueue(cmd, (error, data) => {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
 Search for the required information in returned data array, as they may contain additional and random data from EVENTs.
 @param {Array} data Array of possible responses
 @param {RegExp} regexp to test against
 @return {string|null} found string or null
 */
DenonTelnet.prototype.parseSimpleResponse = function(data, regexp) {
    let match

    for (const line of data) {
        match = regexp.exec(line)

        if (match) {
            return match[1];
        }
    }
    return null;
};



/**
 Get the currently selected input of a zone.
 Telnet Command examples: SI?, Z2SOURCE
 @param {defaultCallback} callback Function to be called when the command is run and data is returned. Will return one or more of: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
 'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
 'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
 @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.getInput(function(error, data) {console.log('INPUT of MAIN ZONE is: ' + JSON.stringify(data));}, 'ZM');
 // INPUT of MAIN ZONE is: "MPLAY"
 */
DenonTelnet.prototype.getInput = function(callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? 'SI' : zone;
    const regexp = RegExp('(?:^|[\r])' + commandPrefix + '([^O0-9]+[^NF]+)');

    this.addCmdToQueue(commandPrefix + '?', (error, data) => {
        if (!error) {
            const input = this.parseSimpleResponse(data, regexp)
            if (input) {
                callback(null, input);
            } else {
                callback('DENON-TELNET: Did not get INPUT RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    });
};



/**
 Select the input of a zone.
 Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD
 @param {string} input Supported values: 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
 'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
 'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.setInput('MPLAY', function(error, data) {console.log('Set INPUT of MAIN ZONE to MPLAY.');});
 // Set INPUT of MAIN ZONE to MPLAY.
 */
DenonTelnet.prototype.setInput = function(input, callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? 'SI' : zone;

    this.addCmdToQueue(commandPrefix + input, (error, data) => {
        if (!error) {
            callback(null, data);
        } else {
            callback(error);
        }
    });
};



/**
 Get the current mute state of a zone.
 Defaults MAIN ZONE, if no zone set.
 Telnet Command examples: SIMPLAY, Z2MPLAY, Z3CD
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.getMuteState(function(error, data) {console.log('MUTE state of ZONE2 is: ' + (data ? 'ON' : 'OFF'));}, 'Z2');
 // MUTE state of ZONE2 is: [ON|OFF]
 */
DenonTelnet.prototype.getMuteState = function(callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? '' : zone;
    const regexp = RegExp('(?:^|[\r])' + commandPrefix + 'MU(ON|OFF)');

    this.addCmdToQueue(commandPrefix + 'MU?', (error, data) => {

        if (!error) {
            const muteState = this.parseSimpleResponse(data, regexp)
            if (muteState) {
                callback(null, (muteState === 'ON'));
            } else {
                callback('DENON-TELNET: Did not get MUTE RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
 Set the mute state of a zone.
 Defaults MAIN ZONE, if no zone set.
 Telnet Command examples: MUON, MUOFF, Z2MUON, Z3MUOFF
 @param {boolean} muteState TRUE for muted
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.setMuteState(true, function(error, data) {console.log('Set MUTE state of ZONE2 to ON.');}, 'Z2');
 // Set MUTE state of ZONE2 to ON.
 */
DenonTelnet.prototype.setMuteState = function(muteState, callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? '' : zone;

    this.addCmdToQueue(commandPrefix + 'MU' + (muteState ? 'ON' : 'OFF'), (error, data) => {
        if (!error) {
            callback(null, muteState);
        } else {
            callback(error);
        }
    });
};



/**
 Get the current volume of a zone.
 There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
 Telnet Command examples: MV10, Z215
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.getVolume(function(error, data) {console.log('VOLUME of MAIN ZONE is: ' + data);}, 'ZM');
 // VOLUME of MAIN ZONE is: [0-100]
 */
DenonTelnet.prototype.getVolume = function(callback, zone) {

    const commandPrefix = (!zone || (zone === 'ZM')) ? 'MV' : zone;
    const regexp = RegExp('(?:^|[\r])' + commandPrefix + '(\\d+)');

    this.addCmdToQueue(commandPrefix + '?', (error, data) => {

        if (!error) {
            const volume = this.parseSimpleResponse(data, regexp)
            if (volume) {
                callback(null, parseInt((volume + '0').slice(0, 3), 10) * 0.1);
            } else {
                callback('DENON-TELNET: Did not get VOLUME RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
 Set the playback volume of a zone.
 There is no MAIN ZONE Volue, its handled by the Mastervolume (MV)
 Telnet Command examples: MV20, Z230, Z340
 @param {number} volume 0-100
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.setVolume(30, function(error, data) {console.log('Set VOLUME of MAIN ZONE to 30.');}, 'ZM');
 // Set VOLUME of MAIN ZONE to 30.
 */
DenonTelnet.prototype.setVolume = function(volume, callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? 'MV' : zone;
    let vol = (volume * 10).toFixed(0);  //volume fix

    if (vol < 100) {
        vol = '0' + vol;
    } else {
        vol = '' + vol;
    }
    this.addCmdToQueue(commandPrefix + vol, (error, data) => {
        if (!error) {
            callback(null, volume);
        } else {
            callback(error);
        }
    });
};



/**
 Returns the current power state of a zone.
 Telnet Command examples: PW?, Z2?, Z3?
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.getZonePowerState(function(error, data) {console.log('POWER state of ZONE3 is: ' + (data ? 'ON' : 'OFF'));}, 'Z3');
 // POWER state of ZONE3 is: [ON|OFF]
 */
DenonTelnet.prototype.getZonePowerState = function(callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? 'ZM' : zone;
    const regexp = RegExp('(?:^|[\r])' + commandPrefix + '(ON|OFF)');

    this.addCmdToQueue(commandPrefix + '?', (error, data) => {


        if (!error) {
            const powerState = this.parseSimpleResponse(data, regexp)
            if (powerState) {
                callback(null, (powerState === 'ON'));
            } else {
                callback('DENON-TELNET: Did not get POWER RESPONSE in time.');
            }
        } else {
            callback(error);
        }
    }, regexp);
};



/**
 Sets the power state of a zone.
 Telnet Command examples: PWON, PWSTANDBY, Z2ON, Z3OFF
 @param {boolean} powerState TRUE to power on
 @param {defaultCallback} callback Function to be called when the command is run and data is returned
 @param {string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
 @example
 var mdt = new MarantzDenonTelnet('127.0.0.1');
 mdt.setZonePowerState(false, function(error, data) {console.log('Set POWER state of ZONE3 to OFF.');}, 'Z3');
 // Set POWER state of ZONE3 to OFF.
 */
DenonTelnet.prototype.setZonePowerState = function(powerState, callback, zone) {
    const commandPrefix = (!zone || (zone === 'ZM')) ? 'MV' : zone;

    this.addCmdToQueue(commandPrefix + (powerState ? 'ON' : 'OFF'), (error, data) => {
        if (!error) {
            callback(null, powerState);
        } else {
            callback(error);
        }
    });
};

export default DenonTelnet




//
// /**
//  Get the current power state of the AVR.
//  Telnet Command examples: PW?
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.getPowerState(function(error, data) {console.log('POWER state of AVR is: ' + (data ? 'ON' : 'OFF'))});
//  // POWER state of AVR is: [ON|OFF]
//  */
// MarantzDenonTelnet.prototype.getPowerState = function(callback) {
//     var mdt = this;
//     var regexp = RegExp(/PW(ON|OFF)/);
//
//     this.addCmdToQueue('PW?', function(error, data) {
//         var ret;
//
//         if (!error) {
//             if (ret = mdt.parseSimpleResponse(data, regexp)) {
//                 callback(null, (ret == 'ON'));
//             } else {
//                 callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
//             }
//         } else {
//             callback("Can't connect to device: " + error, false);
//         }
//     }, regexp);
// };


//
// /**
//  Sets the power state of the AVR.
//  Telnet Command examples: PWON, PWSTANDBY (threr is no PWOFF!)
//  @param {boolean} powerState - TRUE to power the AVR on
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.setPowerState(false, function(error, data) {console.log('Sent power off command to AVR.');});
//  // Set POWER state of AVR to ON.
//  */
// MarantzDenonTelnet.prototype.setPowerState = function(powerState, callback) {
//     this.addCmdToQueue('PW' + (powerState ? 'ON' : 'STANDBY'), function(error, data) {
//         if (!error) {
//             callback(null, powerState);
//         } else {
//             callback(error);
//         }
//     });
// };


//
// /**
//  Get the currently selected SMART SELECT of a zone.
//  Telnet Command examples: MSSMART ?, Z2SMART ?
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned.
//  @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.getSmartSelect(function(error, data) {console.log('SMART SELECT is: ' + JSON.stringify(data));}, 'SMART');
//  // SMART SELECT is: "0"
//  */
// MarantzDenonTelnet.prototype.getSmartSelect = function(callback, zone) {
//     var mdt = this;
//     var commandPrefix = (!zone || (zone == 'ZM')) ? 'MS' : zone;
//     var regexp = RegExp('(?:^|[\r])' + commandPrefix + 'SMART(.*)');
//
//     this.addCmdToQueue(commandPrefix + 'SMART ?', function(error, data) {
//         var ret;
//
//         if (!error) {
//             if (ret = mdt.parseSimpleResponse(data, regexp)) {
//                 callback(null, ret);
//             } else {
//                 callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
//             }
//         } else {
//             callback(error);
//         }
//     }, regexp);
// };


//
// /**
//  Select the SMART SELECT of a zone.
//  Telnet Command examples: SMART1, SMART2
//  @param {number} input Supported values: 1 ... 5
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned
//  @param {?string} zone NULL or ZM for MAIN ZONE, Z2 ... Zn for all others
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.setSmartSelect(1, function(error, data) {console.log('Set SMART SELECT of MAIN ZONE to 1.');});
//  // Set SMART SELECT of MAIN ZONE to 1.
//  */
// MarantzDenonTelnet.prototype.setSmartSelect = function(input, callback, zone) {
//     var commandPrefix = (!zone || (zone == 'ZM')) ? 'MS' : zone;
//
//     this.addCmdToQueue(commandPrefix + 'SMART' + input, function(error, data) {
//         if (!error) {
//             callback(null, data);
//         } else {
//             callback(error);
//         }
//     });
// };


//
// /**
//  Store current setup to SMART SELECT of a zone.
//  Telnet Command examples: SMART1 MEMORY, SMART2 MEMORY
//  @param {number} input Supported values: 1 ... 5
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.storeSmartSelect(1, function(error, data) {console.log('Store current settings to SMART SELECT of MAIN ZONE.');});
//  // Store current settings to SMART SELECT of MAIN ZONE.
//  */
// MarantzDenonTelnet.prototype.storeSmartSelect = function(input, callback) {
//     var commandPrefix = (!zone || (zone == 'ZM')) ? 'MS' : zone;
//
//     this.addCmdToQueue(commandPrefix + 'SMART' + input + ' MEMORY', function(error, data) {
//         if (!error) {
//             callback(null, data);
//         } else {
//             callback(error);
//         }
//     });
// };
//
//
//
// /**
//  Get the currently selected video source.
//  Telnet Command examples: SV?
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned. Will return one or more of:
//  'DVD', 'BD', 'TV', 'SAT/CBL', 'MPLAY', 'GAME', 'AUX1', 'AUX2', 'AUX3', 'AUX4'
//  'AUX5', 'AUX6', 'AUX7', 'CD', 'SOURCE', 'ON', 'OFF'
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.getVideoSelect(function(error, data) {console.log('VIDEO SELECT of MAIN ZONE is: ' + JSON.stringify(data));}, 'ZM');
//  // VIDEO SELECT is: "OFF"
//  */
// MarantzDenonTelnet.prototype.getVideoSelect = function(callback) {
//     var mdt = this;
//     var regexp = RegExp('(?:^|[\r])SV(.*)');
//
//     this.addCmdToQueue('SV?', function(error, data) {
//         var ret;
//
//         if (!error) {
//             if (ret = mdt.parseSimpleResponse(data, regexp)) {
//                 callback(null, ret);
//             } else {
//                 callback('MarantzDenonTelnet: Did not get RESPONSE in time.');
//             }
//         } else {
//             callback(error);
//         }
//     }, regexp);
// };
//
//
//
// /**
//  Select the video source.
//  Telnet Command examples: SVBD, SVDVD, SVCD
//  @param {string} input Supported values: 'DVD', 'BD', 'TV', 'SAT/CBL', 'MPLAY',
//  'GAME', 'AUX1', 'AUX2', 'AUX3', 'AUX4', 'AUX5', 'AUX6', 'AUX7', 'CD', 'SOURCE', 'ON', 'OFF'
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.setVideoSelect('MPLAY', function(error, data) {console.log('Set VIDEO SELECT of MAIN ZONE to MPLAY.');});
//  // Set VIDEO SELECT to MPLAY.
//  */
// MarantzDenonTelnet.prototype.setVideoSelect = function(input, callback) {
//     this.addCmdToQueue('SV' + input, function(error, data) {
//         if (!error) {
//             callback(null, data);
//         } else {
//             callback(error);
//         }
//     });
// };
//
//




// /**
//  Get all supported zones of the AVR.
//  @param {defaultCallback} callback Function to be called when the command is run and data is returned
//  @example
//  var mdt = new MarantzDenonTelnet('127.0.0.1');
//  mdt.getZones(function(error, data) {console.log('Available Zones: ' + JSON.stringify(data));});
//  // Available Zones: {"ZM":"MAIN ZONE","Z2":"ZONE2","Z3":"ZONE3"}
//  */
// MarantzDenonTelnet.prototype.getZones = function(callback) {
//     var mdt = this;
//     var zoneIds = ['', 'ZM', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9'];
//     var zones = {};
//
//     // get number of zones (PW? -> ["PWON","Z2ON","Z3ON"])
//     var handleZoneIds = function(err, data) {
//         var regexp = RegExp(/(Z\d)ON/);
//         var ret;
//
//         if (data) {
//             for (i = 0; i < data.length; i++) {
//                 if (ret = regexp.exec(data[i])) {
//                     zones[ret[1]] = ret[1];
//                 } else if (data[i] == 'PWON') {
//                     zones['ZM'] = 'ZM';
//                 }
//             }
//         }
//         mdt.telnet('RR?', handleZoneNames);
//     };
//
//     // Try to get zone names supported by recent AVR (RR? -> ["R1MAIN ZONE ","R2ZONE2     ","R3ZONE3"])
//     var handleZoneNames = function(err, data) {
//         var regexp = RegExp(/R(\d)(.*)/);
//         var ret;
//         var zoneName;
//
//         if (data) {
//             for (i = 0; i < data.length; i++) {
//                 if (ret = regexp.exec(data[i])) {
//                     zoneName = data[i].trim().substr(2);
//                     zones[zoneIds[parseInt(ret[1], 10)]] = zoneName;
//                 }
//             }
//         }
//         callback(null, zones);                                                  // whatever happens, we finally go on
//     };
//
//     this.addCmdToQueue('PW?', handleZoneIds);
// };
//



