
import threading
import time

class GPSMissionTest(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
    def run(self):
        gps = self.components.get("gps")
        i = 0
        while i < 10:
            time.sleep(3)
            gps.readData()
            i += 1