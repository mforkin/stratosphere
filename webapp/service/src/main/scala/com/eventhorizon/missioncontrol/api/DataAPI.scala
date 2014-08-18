package com.eventhorizon.missioncontrol.api

import com.eventhorizon.missioncontrol.db.DataAccess
import com.eventhorizon.missioncontrol.service.DataService

/**
 * Created by mike on 8/16/14.
 */
trait DataAPI extends API with DataService {
  this: DataAccess =>
  get("/") {
    getData()
  }
}
