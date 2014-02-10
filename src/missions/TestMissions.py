import time
import threading

class CameraTestMission(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
    def run(self):
        camera = self.components.get('camera')
        camera.start_preview()
        time.sleep
        camera.capture('test.png')
        time.sleep(2)
        camera.start_recording('test.h264')
        camera.wait_recording(10)
        camera.stop_recording()
        camera.stop_preview()
