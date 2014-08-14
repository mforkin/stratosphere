from xbee import XBee

import serial
import time

ser = serial.Serial('/dev/ttyUSB0', 9600)



while True:
    try:
        ser.write("Hello World")
        time.sleep(2)
    except KeyboardInterrupt:
        break

ser.close();