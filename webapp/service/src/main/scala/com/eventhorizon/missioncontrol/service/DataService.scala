package com.eventhorizon.missioncontrol.service

import org.joda.time.DateTime

/**
 * Created by mike on 8/16/14.
 */
case class DataPoint(time: DateTime, lat: Double, lon: Double, temp: Double, heading: Double)

trait DataService extends Service {
  def getData () = Seq(DataPoint(new DateTime(), 0, 0, 0, 0), DataPoint(new DateTime(), 1, 1, 1, 1))


}
