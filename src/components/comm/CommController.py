from xbee import XBee

import serial

ser = serial.Serial('/dev/tty.usbserial-62', 9600)

data = ""

while True:
    try:
        response = ser.read()
        if response == ":":
            print data
            data = ""
        else:
            data += response
    except KeyboardInterrupt:
        break

ser.close()

