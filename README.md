We have three main directories

* flightcomputer
   * Main entry point, responsible for running missions
* components
   * These are the glue classes. The will provide an interface (api) to our physical hardware components.
* missions
   * This is where the fun happens. These classes are missions.
   * They should sub-class threading.Thread so we can run multiple missions simultaneous in a multi threaded fashion
      * Make sure to implement __init__ and run functions
   * These will be interacting with our component classes to get relevant information and then applying logic to do cool stuff.

