package com.eventhorizon.missioncontrol.service

import org.joda.time.DateTime
import com.eventhorizon.missioncontrol.db.DataAccess
import com.ccri.ngic_arpeggio.db.jooq.generated.Tables._
import scala.collection.JavaConverters._

/**
 * Created by mike on 8/16/14.
 */
case class DataPoint(timestamp: Long, lat: Double, lon: Double, altitude: Double, heading: Double, temp: Double, radiation: Double)

trait DataService extends Service {
  this: DataAccess =>

  import db._

  def getData() = selectFrom(METRICS).fetch().asScala.toSeq.map(r => DataPoint(r.getMetricTimestamp.getTime, r.getLat, r.getLon, r.getAltitude, r.getHeading, r.getTemp, r.getRadiation)) ++ Seq(DataPoint(new DateTime().getMillis, 0, 0, 0, 0, 0, 0), DataPoint(new DateTime().getMillis, 1, 1, 1, 1, 1, 1))

}
