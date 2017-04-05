definition(
    name: "<PLACEHOLDER: Your App Name>",
    namespace: "<PLACEHOLDER: Your App Namespace>",
    author: "<PLACEHOLDER: Your Username>",
    description: "<PLACEHOLDER: Your App Description>",
    category: "SmartThings Labs",
    iconUrl: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience.png",
    iconX2Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
    iconX3Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
    oauth: true)

/** --------------------+---------------+-----------------------+------------------------------------
 *  Device Type         | Attribute Name| Commands              | Attribute Values
 *  --------------------+---------------+-----------------------+------------------------------------
 *  switches            | switch        | on, off               | on, off
 *  motionSensors       | motion        |                       | active, inactive
 *  contactSensors      | contact       |                       | open, closed
 *  presenceSensors     | presence      |                       | present, 'not present'
 *  temperatureSensors  | temperature   |                       | <numeric, F or C according to unit>
 *  accelerationSensors | acceleration  |                       | active, inactive
 *  waterSensors        | water         |                       | wet, dry
 *  lightSensors        | illuminance   |                       | <numeric, lux>
 *  humiditySensors     | humidity      |                       | <numeric, percent>
 *  locks               | lock          | lock, unlock          | locked, unlocked
 *  garageDoors         | door          | open, close           | unknown, closed, open, closing, opening
 *  cameras             | image         | take                  | <String>
 *  thermostats         | thermostat    | setHeatingSetpoint,   | temperature, heatingSetpoint, coolingSetpoint,
 *                      |               | setCoolingSetpoint,   | thermostatSetpoint, thermostatMode,
 *                      |               | off, heat, cool, auto,| thermostatFanMode, thermostatOperatingState
 *                      |               | emergencyHeat,        |
 *                      |               | setThermostatMode,    |
 *                      |               | fanOn, fanAuto,       |
 *                      |               | fanCirculate,         |
 *                      |               | setThermostatFanMode  |
 *  --------------------+---------------+-----------------------+------------------------------------
 */

//Device Inputs
preferences {
	section("Allow <PLACEHOLDER: Your App Name> to control these things...") {
		input "contactSensors", "capability.contactSensor", title: "Which Contact Sensors", multiple: true, required: false, hideWhenEmpty: true
		input "garageDoors", "capability.garageDoorControl", title: "Which Garage Doors?", multiple: true, required: false, hideWhenEmpty: true
 		input "locks", "capability.lock", title: "Which Locks?", multiple: true, required: false, hideWhenEmpty: true
		input "cameras", "capability.videoCapture", title: "Which Cameras?",  multiple: true, required: false, hideWhenEmpty: true
		input "motionSensors", "capability.motionSensor", title: "Which Motion Sensors?", multiple: true, required: false, hideWhenEmpty: true
		input "presenceSensors", "capability.presenceSensor", title: "Which Presence Sensors", multiple: true, required: false, hideWhenEmpty: true
		input "switches", "capability.switch", title: "Which Switches and Lights?", multiple: true, required: false, hideWhenEmpty: true
		input "thermostats", "capability.thermostat", title: "Which Thermostat?", multiple: true, required: false, hideWhenEmpty: true
		input "waterSensors", "capability.waterSensor", title: "Which Water Leak Sensors?", multiple: true, required: false, hideWhenEmpty: true
	}
}

def getInputs() {
	def inputList = []
	inputList += contactSensors?: []
	inputList += garageDoors?: []
	inputList += locks?: []
	inputList += cameras?: []
	inputList += motionSensors?: []
	inputList += presenceSensors?: []
	inputList += switches?: []
	inputList += thermostats?: []
	inputList += waterSensors?: []
    return inputList
}

//API external Endpoints
mappings {
	path("/devices") {
		action: [
			GET: "getDevices"
		]
	}
	path("/devices/:id") {
		action: [
			GET: "getDevice"
		]
	}
	path("/update/:id") {
		action: [
		  PUT: "updateDevice"
		]
	}
	 path("/subscription") {
		action: [
		  POST: "registerDeviceChange",
		  DELETE: "unregisterDeviceChange"
		]
	}
}

def installed() {
	log.debug "Installing with settings: ${settings}"
	initialize()
}

def updated() {
	log.debug "Updating with settings: ${settings}"
	log.debug "subscriptionMap state: ${state.subscriptionMap}"
	if(state.subscriptionMap == null){
		state.subscriptionMap = [:]
		log.debug "subscriptionMap created."
	}
	unsubscribe()
	registerSubscriptions()
}

def initialize() {
	log.debug "Initializing with settings: ${settings}"
	state.subscriptionMap = [:]
	log.debug "subscriptionMap created."
	registerSubscriptions()
}

//Subscribe events for all devices
def registerSubscriptions() {
	registerChangeHandler(inputs)
}

//Subscribe to events from a list of devices
def registerChangeHandler(myList) {
	myList.each { myDevice ->
		def theAtts = myDevice.supportedAttributes
		theAtts.each {att ->
			subscribe(myDevice, att.name, eventHandler)
			log.info "Subscribing for ${myDevice.displayName}.${att.name}"
		}
	}
}

//Endpoints function: Subscribe to events from a specific device
def registerDeviceChange() {
	def subcriptionEndpt = params.subscriptionURL
	def deviceId = params.deviceId
	def myDevice = findDevice(deviceId)
	if( myDevice == null ){
		httpError(404, "Cannot find device with device ID ${deviceId}.")
	}
    
	def theAtts = myDevice.supportedAttributes
	try {
		theAtts.each {att ->
			subscribe(myDevice, att.name, eventHandler)
		}
        	log.info "Subscribing for ${myDevice.displayName}"
        
        	if(subcriptionEndpt != null){
			if(state.subscriptionMap[deviceId] == null){
				state.subscriptionMap.put(deviceId, [subcriptionEndpt]);
				log.info "Added subcription URL: ${subcriptionEndpt} for ${myDevice.displayName}"
			}else if (!state.subscriptionMap[deviceId].contains(subcriptionEndpt)){
				state.subscriptionMap[deviceId] << subcriptionEndpt
				log.info "Added subcription URL: ${subcriptionEndpt} for ${myDevice.displayName}"
			}
        	}
	} catch (e) {
		httpError(500, "something went wrong: $e")
	}

	log.info "Current subscription map is ${state.subscriptionMap}"
	return ["succeed"]
}

//Endpoints function: Unsubscribe to events from a specific device
def unregisterDeviceChange() {
	def subcriptionEndpt = params.subscriptionURL
	def deviceId = params.deviceId
	def myDevice = findDevice(deviceId)
    
	if( myDevice == null ){
		httpError(404, "Cannot find device with device ID ${deviceId}.")
	}
    
	try {
		if(subcriptionEndpt != null && subcriptionEndpt != "undefined"){
			if (state.subscriptionMap[deviceId]?.contains(subcriptionEndpt)){
				if(state.subscriptionMap[deviceId].size() == 1){
					state.subscriptionMap.remove(deviceId)
				} else {
					state.subscriptionMap[deviceId].remove(subcriptionEndpt)
				}
				log.info "Removed subcription URL: ${subcriptionEndpt} for ${myDevice.displayName}"
			}
        	} else {
			unsubscribe(myDevice)
			state.subscriptionMap.remove(deviceId)
			log.info "Unsubscriping for ${myDevice.displayName}"
		}
	} catch (e) {
		httpError(500, "something went wrong: $e")
	}

	log.info "Current subscription map is ${state.subscriptionMap}" 
}

//When events are triggered, send HTTP post to web socket servers
def eventHandler(evt) {
	def evt_device = evt.device
	def evt_deviceType = getDeviceType(evt_device);
	def deviceInfo
    
	if(evt_deviceType == "thermostat") {
		deviceInfo = [name: evt_device.displayName, id: evt_device.id, status:evt_device.status, deviceType:evt_deviceType, manufacturer:evt_device.manufacturerName, model:evt_device.modelName, attributes: deviceAttributeList(evt_device, evt_deviceType), locationMode: getLocationModeInfo()]
	} else {
		deviceInfo = [name: evt_device.displayName, id: evt_device.id, status:evt_device.status, deviceType:evt_deviceType, manufacturer:evt_device.manufacturerName, model:evt_device.modelName, attributes: deviceAttributeList(evt_device, evt_deviceType)]
	}
    
	def params = [ body: [ deviceInfo ] ]
    
	if(evt.data != null){
		def evtData = parseJson(evt.data)
		log.info "Received event for ${evt_device.displayName}, data: ${evtData},  description: ${evt.descriptionText}"
	}
    
	//send event to all subcriptions urls
	log.debug "Current subscription urls for ${evt_device.displayName} is ${state.subscriptionMap[evt_device.id]}"
	state.subscriptionMap[evt_device.id].each {
		params.uri = "${it}"
		log.trace "POST URI: ${params.uri}"
		log.trace "Payload: ${params.body}"
		try{
			httpPostJson(params) { resp ->
				log.trace "response status code: ${resp.status}"
				log.trace "response data: ${resp.data}"
			}
		} catch (e) {
			log.error "something went wrong: $e"
		}
	}
}

//Endpoints function: return all device data in json format
def getDevices() {
	def deviceData = [] 
	inputs?.each {
		def deviceType = getDeviceType(it)
		if(deviceType == "thermostat") {
			deviceData << [name: it.displayName, id: it.id, status:it.status, deviceType:deviceType, manufacturer:it.manufacturerName, model:it.modelName, attributes: deviceAttributeList(it, deviceType), locationMode: getLocationModeInfo()]
		} else {
			deviceData << [name: it.displayName, id: it.id, status:it.status, deviceType:deviceType, manufacturer:it.manufacturerName, model:it.modelName, attributes: deviceAttributeList(it, deviceType)]
		} 
	}
 
	log.debug "getDevices, return: ${deviceData}"
	return deviceData
}

//Endpoints function: get device data
def getDevice() {	
	def it = findDevice(params.id)
	def deviceType = getDeviceType(it)
	def device
	if(deviceType == "thermostat") {
		device = [name: it.displayName, id: it.id, status:it.status, deviceType:deviceType, manufacturer:it.manufacturerName, model:it.modelName, attributes: deviceAttributeList(it,deviceType), locationMode: getLocationModeInfo()]
	} else {
		device = [name: it.displayName, id: it.id, status:it.status, deviceType:deviceType, manufacturer:it.manufacturerName, model:it.modelName, attributes: deviceAttributeList(it, deviceType)]
	}

	log.debug "getDevice, return: ${device}"
	return device
}

//Endpoints function: update device data
void updateDevice() {	
	def device = findDevice(params.id)
	request.JSON.each {   
		def command = it.key
		def value = it.value
		if (command){
			def commandList = mapDeviceCommands(command, value)
			command = commandList[0]
			value = commandList[1]
			
			if (command == "setAwayMode") {
				log.info "Setting away mode to ${value}"
				if (location.modes?.find {it.name == value}) {
					location.setMode(value)
				}
			}else if (command == "thermostatSetpoint"){
				switch(device.currentThermostatMode){
					case "cool":
						log.info "Update: ${device.displayName}, [${command}, ${value}]"
						device.setCoolingSetpoint(value)
						break
					case "heat":
					case "emergency heat":
						log.info "Update: ${device.displayName}, [${command}, ${value}]"
						device.setHeatingSetpoint(value)
						break
					default:
						httpError(501, "this mode: ${device.currentThermostatMode} does not allow changing thermostat setpoint.")
						break
				}
			}else if (!device) {
				log.error "updateDevice, Device not found"
				httpError(404, "Device not found")
			} else if (!device.hasCommand(command)) {
				log.error "updateDevice, Device does not have the command"
				httpError(404, "Device does not have such command")
			} else {
				if (command == "setColor") {
					log.info "Update: ${device.displayName}, [${command}, ${value}]"
					device."$command"(hex: value)
				} else if(value.isNumber()) {
					def intValue = value as Integer
					log.info "Update: ${device.displayName}, [${command}, ${intValue}(int)]"
					device."$command"(intValue)
				} else if (value){
					log.info "Update: ${device.displayName}, [${command}, ${value}]"
					device."$command"(value)
				} else {
					log.info "Update: ${device.displayName}, [${command}]"
					device."$command"()
				}
			}
		}
	}
}

/*** Private Functions ***/

//Return current location mode info
private getLocationModeInfo() {
	return [mode: location.mode, supported: location.modes.name]
}

//Map each device to a type given it's capabilities
private getDeviceType(device) {
	def deviceType
	def capabilities = device.capabilities
	log.debug "capabilities: [${device}, ${capabilities}]"
	log.debug "supported commands: [${device}, ${device.supportedCommands}]"
    
	//Loop through the device capability list to determine the device type.
	capabilities.each {capability ->
		switch(capability.name.toLowerCase())
		{
			case "switch":
				deviceType = "switch"

				//If the device also contains "Switch Level" capability, identify it as a "light" device.
				if (capabilities.any{it.name.toLowerCase() == "switch level"}){
                	
					//If the device also contains "Power Meter" capability, identify it as a "dimmerSwitch" device.
					if (capabilities.any{it.name.toLowerCase() == "power meter"}){
						deviceType = "dimmerSwitch"
						return deviceType
					} else {
						deviceType = "light"
						return deviceType
					}
				}
				break
			case "garageDoorControl":
				deviceType = "garageDoor"
				return deviceType
			case "lock":
				deviceType = "lock"
				return deviceType
			case "video camera":
				deviceType = "camera"
				return deviceType
			case "thermostat":
				deviceType = "thermostat"
				return deviceType    
			case "acceleration sensor":
			case "contact sensor":
			case "motion sensor":
			case "presence sensor":
			case "water sensor":
				deviceType = "genericSensor"
				return deviceType
			default:
				break
		}
	}
	return deviceType
}

//Return a specific device give the device ID.
private findDevice(deviceId) {
	return inputs?.find { it.id == deviceId }
}
 
//Return a list of device attributes
private deviceAttributeList(device, deviceType) {
	def attributeList = [:]
	def allAttributes = device.supportedAttributes
	allAttributes.each { attribute ->
        	try {
			def currentState = device.currentState(attribute.name)
            		if(currentState != null ){
                		switch(attribute.name){
                    		case 'temperature':
                        		attributeList.putAll([ (attribute.name): currentState.value, 'temperatureScale':location.temperatureScale ])
                        		break;
	                    	default:
        	                	attributeList.putAll([(attribute.name): currentState.value ])
                	        	break;
                		}
                		if( deviceType == "genericSensor" ){
                    			def key = attribute.name + "_lastUpdated"
                			attributeList.putAll([ (key): currentState.isoDate ])
                		}
	            	} else {
            			attributeList.putAll([ (attribute.name): null ]);
            		}
		} catch(e) {
			attributeList.putAll([ (attribute.name): null ]);
		}
	}
    return attributeList
}

//Map device command and value. 
//input command and value are from UWP,
//returns resultCommand and resultValue that corresponds with function and value in SmartApps
private mapDeviceCommands(command, value) {
	log.debug "mapDeviceCommands: [${command}, ${value}]"
	def resultCommand = command
	def resultValue = value
	switch (command) {
		case "switch":
			if (value == 1 || value == "1" || value == "on") {
				resultCommand = "on"
				resultValue = ""
			} else if (value == 0 || value == "0" || value == "off") {
				resultCommand = "off"
				resultValue = ""
			}
			break
		// light attributes
		case "level":
			resultCommand = "setLevel"
			resultValue = value
			break
		case "hue":
			resultCommand = "setHue"
			resultValue = value
			break
		case "saturation":
			resultCommand = "setSaturation"
			resultValue = value
			break
		case "colorTemperature":
			resultCommand = "setColorTemperature"
			resultValue = value
			break
		case "color":	
			resultCommand = "setColor"
			resultValue = value
		// thermostat attributes
		case "hvacMode":
			resultCommand = "setThermostatMode"
			resultValue = value
			break
		case "fanMode":
			resultCommand = "setThermostatFanMode"
			resultValue = value
			break
		case "awayMode":
			resultCommand = "setAwayMode"
			resultValue = value
			break
		case "coolingSetpoint":
			resultCommand = "setCoolingSetpoint"
			resultValue = value
			break
		case "heatingSetpoint":	
			resultCommand = "setHeatingSetpoint"
			resultValue = value
			break
		case "thermostatSetpoint":
			resultCommand = "thermostatSetpoint"
			resultValue = value
			break
		// lock attributes
		case "locked":
			if (value == 1 || value == "1" || value == "lock") {
				resultCommand = "lock"
				resultValue = ""
			}
			else if (value == 0 || value == "0" || value == "unlock") {
				resultCommand = "unlock"
				resultValue = ""
			}
			break
		default:
			break
	 }
	 
	 return [resultCommand,resultValue]
}