from xbee import XBee

import serial
import time

ser = serial.Serial('/dev/ttyUSB0', 9600)

xbee = XBee(ser)

while True:
    try:
        xbee.at(frame='A', command='MY')
        time.sleep(2)
    except KeyboardInterrupt:
        break

ser.close();