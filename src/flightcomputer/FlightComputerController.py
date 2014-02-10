import picamera
from src.missions import TestMissions
class FlightComputer(object):
    def __init__(self, components={}, missions=[]):
        self.components = components
        self.missions = missions
    def runMissions(self):
        for mission in self.missions:
            mission.components = self.components
            mission.start()
        for mission in self.missions:
            mission.join()

def main():
    components = {}
    components['camera'] = picamera.PiCamera()
    missions = []
    missions.append(TestMissions.CameraTestMission())
    fc = FlightComputer(components, missions)
    fc.runMissions()
    components.get('camera').close()

if __name__ == '__main__':
    main()

