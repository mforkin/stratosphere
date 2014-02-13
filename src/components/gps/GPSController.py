import gps
import time

class GPSModule(object):
    def __init__(self):
        self.session = gps.gps("localhost", "2947")
        self.session.stream(gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
    def readData(self):
        report = self.session.next()
        if report['class'] == 'TPV':
            print report
        else:
            print '\n\nnon-data report\n\n'
