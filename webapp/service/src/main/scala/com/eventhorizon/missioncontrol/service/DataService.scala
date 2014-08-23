package com.eventhorizon.missioncontrol.service

import org.joda.time.DateTime
import com.eventhorizon.missioncontrol.db.DataAccess
import com.ccri.ngic_arpeggio.db.jooq.generated.Tables._
import org.json4s.JsonAST._
import org.scalatra.atmosphere._
import scala.collection.JavaConverters._
import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global

/**
 * Created by mike on 8/16/14.
 */
trait DataMessage {
  def messageType: String
}
case class DataPoint(timestamp: Long, lat: Double, lon: Double, altitude: Double, heading: Double, temp: Double, radiation: Double, messageType: String = "data") extends DataMessage
case class DataImage(filename: String, messageType: String = "image") extends DataMessage

trait DataService extends Service {
  this: DataAccess =>

  import db._

  def getData = selectFrom(METRICS)
    .fetch().asScala.toSeq
    .map(r => DataPoint(
      r.getMetricTimestamp.getTime,
      r.getLat,
      r.getLon,
      r.getAltitude,
      r.getHeading,
      r.getTemp,
      r.getRadiation
    ))

  def getImages = selectFrom(IMAGES).orderBy(IMAGES.IMAGE_TIMESTAMP.desc).fetch.asScala.toSeq.map(i => DataImage(i.getFilename))

  def getImage (filename: String) = selectFrom(IMAGES).where(IMAGES.FILENAME.equal(filename)).fetch.asScala.toSeq match {
    case i if i.length == 1 => i.head.getImage
    case _ => Array[Byte]()
  }

}
