package expo.modules.microide

import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.utils.ConnectionStatus

class ExpoMicroIdeModule : Module() {
  private var boardManager: BoardManager? = null

  private fun emitStatus(status: ConnectionStatus) {
    sendEvent("onStatusChange", mapOf(
      "status" to status.toString()
    ))
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Events("onStatusChange")

    Function("hello") {
      return@Function "Hello world Kotlin asd + Expo Modules! 👋"
    }

    AsyncFunction("detectUsbDevices") { promise: Promise ->
      val currentActivity = appContext?.currentActivity
      if (currentActivity != null) {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
          if (boardManager == null) {
            boardManager = BoardManager(
              currentActivity,
              onStatusChanges = { status ->
                emitStatus(status)

                when (status) {
                  is ConnectionStatus.Connected -> {
                    promise.resolve("USB device connected: ${status.usbDevice.deviceName}")
                  }
                  is ConnectionStatus.Error -> {
                    promise.reject("USB_ERROR", "Failed to connect: ${status.error}", null)
                  }
                  else -> {
                    promise.reject("USB_ERROR", "Unexpected connection status", null)
                  }
                }
              },
              onReceiveData = { data ->
                println(data)
                promise.resolve(data)
              }
            )
          }

          val devices = boardManager?.detectUsbDevices()
          if (devices != null) {
            promise.resolve(devices.toString())
          } else {
            promise.reject("NO_DEVICES", "No USB devices detected", null)
          }
        }
      } else {
        promise.reject("ACTIVITY_ERROR", "Activity context is null", null)
      }
    }

  }
}
