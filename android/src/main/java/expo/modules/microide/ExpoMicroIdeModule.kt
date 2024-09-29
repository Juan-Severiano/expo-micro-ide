package expo.modules.microide

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoMicroIdeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Function("hello") {
      "Hello world Kotlin + Expo Modules! 👋"
    }

    Function("sum") {
      String
    }
  }
}
