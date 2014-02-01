import time
import picamera

with picamera.PiCamera() as camera:
    camera.start_preview()
    time.sleep(2)
    camera.capture('test.png')
    time.sleep(2)
    camera.start_recording('test.h264')
    camera.wait_recording(10)
    camera.stop_recording()
    camera.stop_preview()