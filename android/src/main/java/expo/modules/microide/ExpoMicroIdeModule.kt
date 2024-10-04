package expo.modules.microide

import android.hardware.usb.UsbDevice
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.managers.FilesManager
import expo.modules.microide.utils.ConnectionStatus
import expo.modules.microide.utils.MicroDevice
import expo.modules.microide.utils.MicroFile
import expo.modules.microide.utils.toMicroDevice
import kotlinx.coroutines.flow.MutableStateFlow

class ExpoMicroIdeModule : Module() {
  private lateinit var boardManager: BoardManager
  private lateinit var filesManager: FilesManager
  private val status = MutableStateFlow<ConnectionStatus>(ConnectionStatus.Connecting)
  private val isConnected: Boolean get() = status.value is ConnectionStatus.Connected

  private val microDevice: MicroDevice? get() = (status.value as? ConnectionStatus.Connected)?.usbDevice?.toMicroDevice()

  // The current path in files explorer
  val root = mutableStateOf("")

  // Files list in files explorer
  private val files = MutableStateFlow<List<MicroFile>>(listOf())

  private fun emitStatus(status: ConnectionStatus) {
    when (status) {
      is ConnectionStatus.Connected -> {
        sendEvent("onStatusChange", mapOf("status" to "Connected"))
      }
      is ConnectionStatus.Connecting -> {
        sendEvent("onStatusChange", mapOf("status" to "Connecting"))
      }
      is ConnectionStatus.Error -> {
        sendEvent("onStatusChange", mapOf("status" to status.error.toString()))
      }
      is ConnectionStatus.Approve -> {
        sendEvent("onStatusChange", mapOf("status" to "Approve"))
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Events("onStatusChange")

    Function("hello") {
      return@Function "Hello world Kotlin + Expo Modules! 👋"
    }

    Property("status") {
      return@Property status.value.toString()
    }

    Property("isConnected") {
      return@Property isConnected
    }

    Property("board") {
      return@Property microDevice?.board ?: "No device connected"
    }

    AsyncFunction("detectUsbDevices") { promise: Promise ->
      val currentActivity = appContext.currentActivity
      if (currentActivity != null) {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
          boardManager = BoardManager(
            currentActivity,
            onStatusChanges = { newStatus ->
              status.value = newStatus
              emitStatus(newStatus)
            },
            onReceiveData = { data ->
              Log.i("USB_DATA", data)
            }
          )
          try {
            // Detect USB devices and convert them to a list of MicroDevice
            val devices = boardManager.detectUsbDevices()

            if (devices != null) {
              if (devices.isNotEmpty()) {
                val resultArray = devices.map { device ->
                        mapOf(
                          "deviceName" to device.deviceName,
                          "productId" to device.productId,
                          "vendorId" to device.vendorId
                        )
                }
                promise.resolve(resultArray)
              } else {
                promise.reject("NO_DEVICES", "No USB devices detected", null)
              }
            }
          } catch (e: Exception) {
            promise.reject("DEVICE_ERROR", "Error detecting devices: ${e.message}", null)
          }
        }
      } else {
        promise.reject("ACTIVITY_ERROR", "Activity context is null", null)
      }
    }


    AsyncFunction("showFilesAndDirs") { promise: Promise ->
      val handler = Handler(Looper.getMainLooper())
      handler.post {
        try {
          filesManager = FilesManager(boardManager) { fileList ->
            files.value = fileList
            // Map the file list to a result array
            val resultArray = fileList.map { file ->
              mapOf(
                "name" to file.name,
                "path" to file.path,
                "size" to file.fullPath,
                "isDirectory" to file.canRun
              )
            }
            promise.resolve(resultArray)
          }
          filesManager.listDir()
        } catch (e: Exception) {
          promise.reject("FILE_ERROR", "Error listing files: ${e.message}", null)
        }
      }
    }

    AsyncFunction("readFile") { path: String, promise: Promise ->
      val handler = Handler(Looper.getMainLooper())
      handler.post {
        try {
          filesManager.read(path) { content ->
            promise.resolve(content)
          }
        } catch (e: Exception) {
          promise.reject("READ_ERROR", "Error reading file: ${e.message}", null)
        }
      }
    }

    AsyncFunction("sendFile") { path: String, content: String, promise: Promise ->
      val handler = Handler(Looper.getMainLooper())
      handler.post {
        try {
          filesManager.write(path, content) {
            promise.resolve("File sent successfully")
          }
        } catch (e: Exception) {
          promise.reject("WRITE_ERROR", "Error sending file: ${e.message}", null)
        }
      }
    }
  }
}
