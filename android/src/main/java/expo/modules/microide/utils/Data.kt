package expo.modules.microide.utils

import android.hardware.usb.UsbDevice
import java.io.File

/**
 * For BoardManager
 */

enum class ExecutionMode {
  INTERACTIVE,
  SCRIPT
}

/**
 * For EditorManager
 */
enum class EditorMode {
  LOCAL,
  REMOTE
}

/**
 * For DeviceManager
 */
sealed class ConnectionStatus {
  data class Error(
    val error: String,
    val msg: String = "",
  ) : ConnectionStatus()

  data object Connecting : ConnectionStatus()
  data class Connected(val usbDevice: UsbDevice) : ConnectionStatus()
  data class Approve(val usbDevices: List<UsbDevice?>) : ConnectionStatus()
}

enum class ConnectionError {
  NO_DEVICES,
  CANT_OPEN_PORT,
  CONNECTION_LOST,
  PERMISSION_DENIED,
  NOT_SUPPORTED,
}

data class MicroDevice(
  val port: String,
  val board: String,
  val isMicroPython: Boolean
)

fun UsbDevice.toMicroDevice(): MicroDevice {
  return MicroDevice(
    port = deviceName,
    board = "$manufacturerName - $productName",
    isMicroPython = true
  )
}


/**
 * For ScriptsManager
 */
data class MicroScript(val name: String, val path: String) {
  val file: File get() = File(path)
  val parentFile: File get() = file.parentFile!!
  val isPython: Boolean get() = name.trim().endsWith(".py")
}

/**
 * For FilesManager
 */
data class MicroFile(
  val name: String,
  var path: String = "",
  private val type: Int = FILE,
  private val size: Int = 0,
) {
  val fullPath: String get() = if (path.isEmpty()) name else "$path/$name".replace("//", "/")
  val isFile: Boolean get() = type == FILE
  val canRun: Boolean get() = ext == ".py"

  private val ext: String
    get() {
      return if (isFile && name.contains(".")) name.substring(name.indexOf(".")).trim()
      else ""
    }

  companion object {
    const val DIRECTORY = 0x4000
    const val FILE = 0x8000
  }
}