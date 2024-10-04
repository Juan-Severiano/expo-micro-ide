package expo.modules.microide.managers

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.app.PendingIntent.FLAG_MUTABLE
import android.app.PendingIntent.FLAG_UPDATE_CURRENT
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Build.VERSION.SDK_INT
import android.os.Handler
import android.os.Parcelable
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import expo.modules.microide.utils.ConnectionError
import expo.modules.microide.utils.ConnectionStatus
import expo.modules.microide.utils.ExecutionMode

/**
 * This class is responsible for:
 * - USB to Serial connection between the microcontroller and smartphone.
 * - sending & receiving data/commands.
 */

class BoardManager(
  private val context: Context,
  private val onStatusChanges: ((status: ConnectionStatus) -> Unit)? = null,
  private val onReceiveData: ((data: String) -> Unit)? = null,
) : SerialInputOutputManager.Listener, DefaultLifecycleObserver {

  companion object {
    private const val TAG = "BoardManager"
    private const val ACTION_USB_PERMISSION = "USB_PERMISSION"
    private const val WRITING_TIMEOUT = 5000
  }

  private val activity = context as AppCompatActivity

  private lateinit var usbManager: UsbManager
  private var serialInputOutputManager: SerialInputOutputManager? = null
  private var port: UsbSerialPort? = null
  private val isPortOpen: Boolean get() = port?.isOpen == true

  private var onReadSync: ((data: String) -> Unit)? = null
  private var syncData = StringBuilder("")
  private var executionMode = ExecutionMode.INTERACTIVE
  private var permissionGranted = false

  //devices to connect with
  //only micropython is supported right now
  private val supportedManufacturers = mutableListOf(
    "MicroPython" // for micro python
  )
  private var supportedProducts = mutableSetOf<Int>()


  /**
   * How does it work ?
   * 1 - Detect Connected Devices
   * 2 - Check for usb Permission
   * 3 - Connect to MicroPython/CircuitPython Device
   */


  init {
    activity.lifecycle.addObserver(this)
    getProducts()
    onStatusChanges?.invoke(ConnectionStatus.Connecting)
  }

  override fun onCreate(owner: LifecycleOwner) {
    Log.i(TAG, "onCreate")
    super.onCreate(owner)
    detectUsbDevices()
  }

  override fun onDestroy(owner: LifecycleOwner) {
    Log.i(TAG, "onDestroy")
    super.onDestroy(owner)
    try {
      //unregister usb broadcast receiver on destroy to avoid repeating its callback
      context.unregisterReceiver(usbReceiver)
      if (port?.isOpen == true) port?.close()
    } catch (e: Exception) {
      // e.printStackTrace()
    }
  }


  /**
   * Public Methods
   */


  /**
   * Write python code to serial port and return response in the callback
   */
  private fun writeSync(
    code: String,
    onResponse: ((data: String) -> Unit)? = null
  ) {
    executionMode = ExecutionMode.SCRIPT
    syncData.clear()
    onReadSync = { result ->
      //Log.v(TAG, "syncInput - $code")
      Log.v(TAG, "syncResult - $result")
      onResponse?.invoke(result)
      executionMode = ExecutionMode.INTERACTIVE
      syncData.clear()
      onReadSync = null
    }
    val cmd = "\u000D" + code + "\u000D"
    try {
      port?.write(cmd.toByteArray(Charsets.UTF_8), WRITING_TIMEOUT)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Writes the given code in silent mode.
   *
   * In silent mode, the output of the code is not displayed in the REPL.
   *
   * @param code The code to write.
   * @param onResponse A callback that will be invoked with the output of the code, if any.
   */
  fun writeInSilentMode(
    code: String,
    onResponse: ((data: String) -> Unit)? = null
  ) {
    writeCommand(CommandsManager.SILENT_MODE)
    writeSync(code, onResponse = onResponse)
    writeCommand(CommandsManager.RESET)
  }

  /**
   * Write python statement to the serial REPL
   * don't wait to response it will be echoed to SerialInputOutputManager listener
   */
  fun write(code: String, onWrite: (() -> Unit)? = null) {
    try {
      /**
       *  - \u000D == \r
       *  - \r is required before code to print >>>
       *  - \r requires \r after code to echo response
       */
      Log.v(TAG, "write: $code")
      val cmd = "\u000D" + code + "\u000D"
      port?.write(cmd.toByteArray(Charsets.UTF_8), WRITING_TIMEOUT)
      onWrite?.invoke()
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Write REPL commands that don't require to echo >>>
   */
  fun writeCommand(code: String, onWrite: (() -> Unit)? = null) {
    try {
      port?.write(code.toByteArray(Charsets.UTF_8), WRITING_TIMEOUT)
      onWrite?.invoke()
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }


  /**
   * List the connected devices & connect to the supported devices only
   */
  fun detectUsbDevices(): List<UsbDevice>? {
    usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    val deviceList = usbManager.deviceList // Map<Int, UsbDevice>

    // Filtra apenas os dispositivos compatíveis
    val supportedDevices = deviceList.values.filter {
      supportedManufacturers.contains(it.manufacturerName) || supportedProducts.contains(it.productId)
    }

    Log.i(TAG, "detectUsbDevices - deviceList size = ${deviceList.size}")

    return if (supportedDevices.isNotEmpty()) {
      approveDevice(supportedDevices.first())
      supportedDevices
    } else {
      if (deviceList.isNotEmpty()) {
        onStatusChanges?.invoke(ConnectionStatus.Approve(usbDevices = deviceList.values.toList()))
      } else {
        throwError(ConnectionError.NO_DEVICES)
      }
      null
    }
  }
  
  private fun approveDevice(usbDevice: UsbDevice) {
    Log.i(TAG, "supportedDevice - $usbDevice")
    if (usbManager.hasPermission(usbDevice)) connectToSerial(usbDevice)
    else requestUsbPermission(usbDevice)
  }

  fun onDenyDevice() {
    throwError(error = ConnectionError.NOT_SUPPORTED)
  }

  private fun onDisconnectDevice() {
    throwError(error = ConnectionError.CONNECTION_LOST)
  }

  fun onForgetDevice(device: UsbDevice) {
    onDisconnectDevice()
    removeProduct(device.productId)
    detectUsbDevices()
  }

  @SuppressLint("UnspecifiedRegisterReceiverFlag")
  private fun requestUsbPermission(usbDevice: UsbDevice) {
    Log.i(TAG, "Solicitation permission USB")

    val permissionIntent = PendingIntent.getBroadcast(
      context,
      0,
      Intent(ACTION_USB_PERMISSION).apply { `package` = context.packageName },
      if (SDK_INT >= 31) FLAG_MUTABLE or FLAG_UPDATE_CURRENT else 0
    )
    val filter = IntentFilter(ACTION_USB_PERMISSION)

    if (SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      context.registerReceiver(usbReceiver, filter)
    }

    permissionGranted = false
    usbManager.requestPermission(usbDevice, permissionIntent)
  }

  private val usbReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      Log.i(TAG, "onReceive USB Permission")
      if (permissionGranted || isPortOpen) return
      if (ACTION_USB_PERMISSION == intent.action) {
        synchronized(this) {
          val device: UsbDevice? = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
          if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
            Log.i(TAG, "Permissão concedida para dispositivo USB")
            permissionGranted = true
            if (device != null) {
              connectToSerial(device)
            }
          } else {
            Log.e(TAG, "Permissão negada para dispositivo USB")
            throwError(ConnectionError.PERMISSION_DENIED)
          }
        }
      }
    }
  }


  /**
   * Make a serial connection to a usb device
   */
  private fun connectToSerial(usbDevice: UsbDevice) {
    val allDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
    if (allDrivers.isNullOrEmpty()) {
      throwError(ConnectionError.CANT_OPEN_PORT)
      return
    }
    val ports = allDrivers[0].ports
    if (ports.isEmpty()) return
    val connection = usbManager.openDevice(usbDevice) ?: return
    Log.i(TAG, "connection - $connection")
    port = ports[0]
    Log.i(TAG, "port - $port")

    try {
      port?.open(connection)
      port?.dtr = true
    } catch (e: Exception) {
      e.printStackTrace()
      throwError(ConnectionError.CANT_OPEN_PORT)
      return
    }
    port?.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)

    serialInputOutputManager = SerialInputOutputManager(port, object : SerialInputOutputManager.Listener {
      override fun onNewData(data: ByteArray) {
        val receivedData = String(data, Charsets.UTF_8)
        Log.i(TAG, "Dados recebidos: $receivedData")
        onReceiveData?.invoke(receivedData)
      }

      override fun onRunError(e: Exception) {
        Log.e(TAG, "Erro ao rodar: ${e.message}")
        onStatusChanges?.invoke(ConnectionStatus.Error(ConnectionError.CONNECTION_LOST))
      }
    })

    Thread(serialInputOutputManager).start()

    if (isPortOpen) {
      onStatusChanges?.invoke(ConnectionStatus.Connected(usbDevice))
      storeProductId(usbDevice.productId)
    } else {
      throwError(ConnectionError.CANT_OPEN_PORT)
    }

    Log.i(TAG, "Porta aberta ${port?.isOpen}")
  }

  override fun onNewData(bytes: ByteArray?) {
    val data = bytes?.toString(Charsets.UTF_8).orEmpty()
    when (executionMode) {
      ExecutionMode.SCRIPT -> {
        syncData.append(data)
        Log.v(TAG, "$ $data")
        val isDone =
          CommandsManager.isSilentExecutionDone(data) || CommandsManager.isSilentExecutionDone(syncData.toString())

        if (isDone) {
          Log.i(TAG, "syncData -\n$syncData")
          val result = CommandsManager.trimSilentResult(syncData.toString())
          onReadSync?.invoke(result)
        }
      }

      ExecutionMode.INTERACTIVE -> {
        val response = removeEnding(data)
        Log.v(TAG, "onNewData - response ${Gson().toJson(response)}")
        if (response.isNotEmpty() && response.trim() != ">>>") onReceiveData?.invoke(
          response
        )
      }
    }
  }

  override fun onRunError(e: Exception?) {
    val errorMessage = e?.message ?: ""
    Log.e(TAG, "onRunError - ${e?.message}")
    onStatusChanges?.invoke(ConnectionStatus.Connecting)
    Handler(activity.mainLooper).postDelayed({
      if (usbManager.deviceList.isEmpty()) throwError(
        ConnectionError.CONNECTION_LOST,
        errorMessage
      )
      else throwError(ConnectionError.CANT_OPEN_PORT, errorMessage)
    }, 2000)
  }

  private fun throwError(error: ConnectionError, msg: String = "") {
    if (port?.isOpen == true) port?.close()
    serialInputOutputManager?.stop()
    onStatusChanges?.invoke(
      ConnectionStatus.Error(error = error, msg = msg)
    )
  }

  private fun removeEnding(input: String): String {
    val regexPattern = Regex("\\n>>>\\s*(?:\\r\\n>>>\\s*)*$")
    return regexPattern.replace(input, "")
  }


  private inline fun <reified T : Parcelable> Intent.parcelable(key: String): T? = when {
    SDK_INT >= 33 -> getParcelableExtra(key, T::class.java)
    else -> @Suppress("DEPRECATION") getParcelableExtra(key) as? T
  }

  /**
   * Store or Fetch supported product ids in shared-preferences
   */

  private fun removeProduct(productId: Int) {
    supportedProducts.remove(productId)
    supportedManufacturers.clear()
    val json = Gson().toJson(supportedProducts).orEmpty()
    val sharedPref = activity.getPreferences(Context.MODE_PRIVATE) ?: return
    with(sharedPref.edit()) {
      putString("products", json)
      apply()
    }
    Log.i(TAG, "remove ProductId ---> $productId")
  }

  private fun storeProductId(productId: Int) {
    supportedProducts.add(productId)
    val json = Gson().toJson(supportedProducts).orEmpty()
    val sharedPref = activity.getPreferences(Context.MODE_PRIVATE) ?: return
    with(sharedPref.edit()) {
      putString("products", json)
      apply()
    }
    Log.i(TAG, "store ProductId ---> $productId")
  }

  private fun getProducts() {
    val sharedPref = activity.getPreferences(Context.MODE_PRIVATE) ?: return
    val json = sharedPref.getString("products", "").orEmpty()
    if (json.isEmpty()) return
    try {
      val set = object : TypeToken<MutableSet<Int?>?>() {}.type
      supportedProducts = Gson().fromJson(json, set)
      Log.w(TAG, "stored products - $json")
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
}
