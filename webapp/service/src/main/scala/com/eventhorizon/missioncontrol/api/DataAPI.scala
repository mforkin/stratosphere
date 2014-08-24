package com.eventhorizon.missioncontrol.api

import com.eventhorizon.missioncontrol.db.DataAccess
import com.eventhorizon.missioncontrol.service.DataService
import org.scalatra.atmosphere._

import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global

/**
 * Created by mike on 8/16/14.
 */
trait DataAPI extends API with AtmosphereSupport with DataService {
  this: DataAccess =>
  get("/") {
    getData
  }

  get("/images") {
    getImages
  }

  get("/image/:filename") {
    val filename = params("filename")
    val ext = filename.split("[.]").last

    response.setHeader("Accept-Ranges", "bytes")
    response.setContentType("image/" + ext)

    getImage(filename)
  }

  atmosphere("/data-stream") {
    new AtmosphereClient {
      def receive = {
        case Connected =>
        case Disconnected(disconnector, Some(error)) =>
        case Error(Some(error)) =>
        case TextMessage(text) =>
        case JsonMessage(json) =>
      }
    }
  }
}
