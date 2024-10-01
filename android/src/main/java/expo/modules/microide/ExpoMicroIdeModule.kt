package expo.modules.microide

import android.hardware.usb.UsbDevice
import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.utils.ConnectionStatus
import java.util.HashMap


class ExpoMicroIdeModule : Module() {
  private var boardManager: BoardManager? = null
  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Function("hello") {
      return@Function "Hello world Kotlin + Expo Modules! 👋"
    }


    AsyncFunction("connectUSB") { promise: Promise ->
      val currentActivity = appContext?.currentActivity
      if (currentActivity != null) {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
          if (boardManager == null) {
            boardManager = BoardManager(
              currentActivity,
              onStatusChanges = { status ->
                when (status) {
                  is ConnectionStatus.Connected -> {
                    promise.resolve("USB device connected: ${status.usbDevice.deviceName}")
                  }
                  is ConnectionStatus.Error -> {
//                    promise.reject("USB_ERROR", "Failed to connect: ${status.error}")
                  }
                  else -> {
//                    promise.reject("USB_ERROR", "Unexpected connection status")
                  }
                }
              },
              onReceiveData = { data ->
                println(data)
                promise.resolve(data) // Resolve the promise with the received data
              }
            )
          }

          val devices = boardManager?.detectUsbDevices()
          if (devices != null) {
            // If devices are detected, resolve the promise with a list or details
            promise.resolve(devices.toString())
          } else {
            // If no devices found, reject the promise
//            promise.reject("NO_DEVICES", "No USB devices detected")
          }
        }
      } else {
//        promise.reject("ACTIVITY_ERROR", "Activity context is null")
      }
    }

  }
}
