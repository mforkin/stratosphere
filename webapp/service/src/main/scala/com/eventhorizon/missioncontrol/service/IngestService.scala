package com.eventhorizon.missioncontrol.service

import java.io._
import java.nio.file.Files
import java.sql.Timestamp
import com.eventhorizon.missioncontrol.db.DataAccess
import com.eventhorizon.missioncontrol.db.DataAccess.DefaultQueryCache
import com.typesafe.config.ConfigFactory
import grizzled.slf4j.Logger
import org.apache.camel.Exchange
import org.apache.camel.impl.{DefaultCamelContext, SimpleRegistry}
import org.apache.camel.scala.dsl.builder.RouteBuilder
import org.json4s.JsonAST._
import org.scalatra.atmosphere.{JsonMessage, AtmosphereClient}
import com.ccri.ngic_arpeggio.db.jooq.generated.Tables._
import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global

import scala.reflect.ClassTag

/**
 * Created by mike on 8/18/14.
 */
trait IngestService {
  val reg = new SimpleRegistry
  val conf = ConfigFactory.load()
  val camelService = new CamelService with DataAccess {
    val db = DataAccess.buildDBPool(conf.getConfig("db"))
    val cache = new DefaultQueryCache
  }

  def buildIngester[T <: RoutesBase](implicit ct: ClassTag[T]) {
    val routes = ct.runtimeClass.newInstance().asInstanceOf[T]
    val ctx = new DefaultCamelContext(reg)

    ctx.addRoutes(routes)
    ctx.start()
    reg.put(routes.id, ctx)
  }

  def initiate () {
    reg.put("camelService", camelService)

    buildIngester[IngestRoute]
  }
}

object IngestService {
  val service = new IngestService {}
  def initIngestion() = service.initiate()
}

trait CamelService {
  this: DataAccess =>

  implicit def dp2jm (dp: DataPoint) = JsonMessage(JObject(List(JField("type", JString(dp.messageType)), JField("timestamp", JDecimal(dp.timestamp)), JField("lat", JDouble(dp.lat)), JField("lon", JDouble(dp.lon)), JField("altitude", JDouble(dp.altitude)), JField("heading", JDouble(dp.heading)), JField("temp", JDouble(dp.temp)), JField("radiation", JDouble(dp.radiation)))))
  implicit def im2jm (image: DataImage) = JsonMessage(JObject(List(JField("filename", JString(image.filename)), JField("type", JString(image.messageType)))))

  import db._

  def parseFile (file: File, exchange: Exchange) = {
    val inStream = new BufferedReader(new FileReader(file))
    try {
      val line = inStream.readLine()
      val metrics = line.split(",")
      insertInto(METRICS, METRICS.METRIC_TIMESTAMP, METRICS.LAT, METRICS.LON, METRICS.ALTITUDE, METRICS.HEADING, METRICS.TEMP, METRICS.RADIATION)
        .values(new Timestamp(metrics(0).toLong), Double.box(metrics(1).toDouble), Double.box(metrics(2).toDouble), Double.box(metrics(3).toDouble), Double.box(metrics(4).toDouble), Double.box(metrics(5).toDouble), Double.box(metrics(6).toDouble))
        .execute()
      broadcastMessage(DataPoint(metrics(0).toLong, metrics(1).toDouble, metrics(2).toDouble, metrics(3).toDouble, metrics(4).toDouble, metrics(5).toDouble, metrics(6).toDouble))
    } catch {
      case e: Exception => {
        var err = e.getStackTraceString
        Logger.rootLogger.info(e.getMessage)
        Logger.rootLogger.info(err)
        Logger.rootLogger.info(e.getMessage)
      }
    } finally {
      inStream.close()
    }
  }

  def imageIngest (file: File, exchange: Exchange) = {
    try {
      insertInto(IMAGES, IMAGES.FILENAME, IMAGES.IMAGE, IMAGES.IMAGE_TIMESTAMP).values(file.getName, Files.readAllBytes(file.toPath), new Timestamp(file.getName.split("[.]").head.toLong)).execute
      broadcastImageMessage(file.getName)
    } catch {
      case e: Exception => println("Error ingesting image")
    }
  }

  def broadcastMessage (dp: DataPoint) = AtmosphereClient.broadcast("/missioncontrol/rest/data/data-stream", dp)
  def broadcastImageMessage (filename: String) = AtmosphereClient.broadcast("/missioncontrol/rest/data/data-stream", DataImage(filename))
}

trait RoutesBase extends RouteBuilder with RouteImplicits {
  val id: String
}

trait RouteImplicits {
  implicit class RicherExchange(re: Exchange) {
    def headers[T](key: String)(implicit ct: ClassTag[T]): T =
      re.getIn.getHeader(key, ct.runtimeClass).asInstanceOf[T]
  }
}

class IngestRoute extends RoutesBase {
  override val id = "IngestRoute"

  "file:/tmp/missioncontrol/images" ==> {
    convertBodyTo(classOf[File])
    --> ("bean:camelService?method=imageIngest")
  }

  "file:/tmp/missioncontrol" ==> {
    convertBodyTo(classOf[File])
    --> ("bean:camelService?method=parseFile")
  }
}


