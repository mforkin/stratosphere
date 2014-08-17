import com.eventhorizon.missioncontrol.api.DataAPI
import com.typesafe.config.ConfigFactory
import org.scalatra._
import javax.servlet.ServletContext
import org.scalatra.scalate.ScalateSupport

class DefaultServlet extends ScalatraServlet with ScalateSupport {
  get("/") {
    //val user = SecurityContextHolder.getContext.getAuthentication.getPrincipal.asInstanceOf[User]
    val conf = ConfigFactory.load()

    contentType = "text/html; charset=UTF-8"
    response.setHeader("X-UA-Compatible", "IE=edge")
    ssp(
      "index"
      //"userId" -> "1",
      //"userName" -> user.getUsername,
      //"isAdmin" -> user.getAuthorities.toArray.foldLeft(false)((isAdmin, auth) => isAdmin || (auth.asInstanceOf[SimpleGrantedAuthority].getAuthority == "ROLE_ADMIN")),
    )
  }
}

class ScalatraBootstrap extends LifeCycle {
  override def init(context: ServletContext) {
    context.mount(new DefaultServlet, "/", "missioncontrol")
    context.mount(new DataAPI {}, "/rest/data", "missioncontrol/data")
  }
}
