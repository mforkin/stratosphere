package com.eventhorizon.missioncontrol.api

import org.scalatra.ScalatraServlet
import org.scalatra.json.JacksonJsonSupport
import org.json4s.{DefaultFormats, Formats}

/**
 * Created by mforkin on 5/29/14.
 */
trait APIMarshalling extends JacksonJsonSupport {
  protected implicit val jsonFormats: Formats = DefaultFormats
}

trait API extends ScalatraServlet with APIMarshalling {
  before() {
    contentType = formats("json")
  }
}
