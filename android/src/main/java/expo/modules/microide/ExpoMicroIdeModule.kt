package expo.modules.microide

import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.managers.FilesManager
import expo.modules.microide.utils.ConnectionStatus

class ExpoMicroIdeModule : Module() {
  private var boardManager: BoardManager? = null
  private var filesManager: FilesManager? = null

  private fun emitStatus(status: ConnectionStatus) {
    when(status) {
      is ConnectionStatus.Connected -> {
        sendEvent("onStatusChange", mapOf(
          "status" to "Connected"
        ))
      }
      is ConnectionStatus.Connecting -> {
        sendEvent("onStatusChange", mapOf(
          "status" to "Connecting"
        ))
      }
      is ConnectionStatus.Error -> {
        sendEvent("onStatusChange", mapOf(
          "status" to status.error.toString()
        ))
      }
      is ConnectionStatus.Approve -> {
        sendEvent("onStatusChange", mapOf(
          "status" to "Approve"
        ))
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Events("onStatusChange")

    Function("hello") {
      return@Function "Hello world Kotlin asd + Expo Modules! 👋"
    }

    AsyncFunction("detectUsbDevices") { promise: Promise ->
      val currentActivity = appContext.currentActivity
      if (currentActivity != null) {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
          if (boardManager == null) {
            boardManager = BoardManager(
              currentActivity,
              onStatusChanges = { status ->
                emitStatus(status)
                Log.i("Status",status.toString())

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

    AsyncFunction("showFilesAndDirs") { promise: Promise ->
      val currentActivity = appContext.currentActivity
      if (currentActivity != null) {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
          if (filesManager == null && boardManager != null) {
            filesManager = FilesManager(
              boardManager!!
            )
          }

          val filesAndDirs = filesManager?.listDir()
          if (filesAndDirs != null) {
            promise.resolve(filesAndDirs)
          } else {
            promise.reject("NO_FILES", "No files detected in the device", null)
          }
        }
      } else {
        promise.reject("ACTIVITY_ERROR", "Activity context is null", null)
      }
    }
  }
}
