package com.eventhorizon.missioncontrol.service

import com.typesafe.config.ConfigFactory

/**
 * Created by mforkin on 5/29/14.
 */
trait Service {
  val conf = ConfigFactory.load()
}
