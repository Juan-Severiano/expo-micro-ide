package expo.modules.microide

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.utils.ConnectionStatus


class ExpoMicroIdeModule : Module() {
  private var boardManager: BoardManager? = null
  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Function("hello") {
      "Hello world Kotlin + Expo Modules! 👋"
    }

    AsyncFunction("connectUSB") { promise: Promise ->
      if (boardManager == null) {
        boardManager = appContext?.reactContext?.let {
          BoardManager(
            it,
            onStatusChanges = { status ->
                when (status) {
                  is ConnectionStatus.Connected -> {
                    promise.resolve(
                      "USB device connected: ${status.usbDevice.deviceName}")
                  }

                  is ConnectionStatus.Error -> {
                    promise.reject("USB_ERROR", "Failed to connect: ${status.error}", throw Error())
                  }

                  else -> {
                    promise.reject("USB_ERROR", "Unexpected connection status", throw Error())
                  }
                }
            },
            onReceiveData = { data ->
                println(data)
            }
          )
        }
      }

      boardManager?.detectUsbDevices()
    }
  }
}
