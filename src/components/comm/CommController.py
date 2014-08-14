from xbee import XBee

import serial

ser = serial.Serial('/dev/tty.usbserial-62', 9600)



while True:
    try:
        response = ser.read()
        print response
    except KeyboardInterrupt:
        break

ser.close()

