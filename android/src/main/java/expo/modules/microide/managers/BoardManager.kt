package expo.modules.microide.managers

import android.annotation.SuppressLint
import android.app.Activity
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
import com.hoho.android.usbserial.driver.CdcAcmSerialDriver
import com.hoho.android.usbserial.driver.ProbeTable
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import expo.modules.microide.managers.CommandsManager
import expo.modules.microide.utils.ConnectionError
import expo.modules.microide.utils.ConnectionStatus
import expo.modules.microide.utils.ExecutionMode

/**
 * BoardManager
 * 
 * Esta classe é responsável por:
 * - Gerenciar a conexão USB Serial entre o microcontrolador e o smartphone
 * - Enviar e receber dados/comandos
 * - Gerenciar eventos de conexão e desconexão
 * - Prevenir erros de chamadas duplicadas
 * 
 * O BoardManager implementa SerialInputOutputManager.Listener para receber dados da porta serial
 * e DefaultLifecycleObserver para gerenciar o ciclo de vida da conexão junto com a Activity.
 */

class BoardManager(
  private val context: Activity,
  private val onStatusChanges: ((status: ConnectionStatus) -> Unit)? = null,
  private val onReceiveData: ((data: String) -> Unit)? = null,
  private val onBoardConnect: ((device: UsbDevice) -> Unit)? = null,
  private val onBoardDisconnect: ((device: UsbDevice?) -> Unit)? = null,
  private val onConnectionError: ((error: ConnectionError, message: String) -> Unit)? = null
) : SerialInputOutputManager.Listener, DefaultLifecycleObserver {

  companion object {
    private const val TAG = "BoardManager"
    private const val ACTION_USB_PERMISSION = "USB_PERMISSION"
    private const val WRITING_TIMEOUT = 5000
    private const val RECONNECT_DELAY = 2000
  }
  
  /**
   * Dispositivo USB atualmente conectado
   */
  var currentDevice: UsbDevice? = null
    private set // Somente a classe pode modificar, mas outros podem ler

  private val activity = context as AppCompatActivity

  private lateinit var usbManager: UsbManager
  private var serialInputOutputManager: SerialInputOutputManager? = null
  private var port: UsbSerialPort? = null
  private val isPortOpen: Boolean get() = port?.isOpen == true

  private var onReadSync: ((data: String) -> Unit)? = null
  private var syncData = StringBuilder("")
  private var executionMode = ExecutionMode.INTERACTIVE
  private var permissionGranted = false
  private var isConnecting = false // Evita chamadas duplicadas durante a conexão

  // Dispositivos suportados para conexão
  // Atualmente apenas MicroPython é suportado
  private val supportedManufacturers = mutableListOf(
    "MicroPython", // para MicroPython
    "CircuitPython" // para CircuitPython
  )
  private var supportedProducts = mutableSetOf<Int>()


  /**
   * How does it work ?
   * 1 - Detect Connected Devices
   * 2 - Check for usb Permission
   * 3 - Connect to MicroPython/CircuitPython Device
   */


  /**
   * Inicialização do BoardManager
   * - Adiciona o observer do ciclo de vida
   * - Carrega os produtos suportados da preferência
   * - Inicia o processo de conexão
   */
  init {
    activity.lifecycle.addObserver(this)
    getProducts()
    onStatusChanges?.invoke(ConnectionStatus.Connecting)
  }

  /**
   * Chamado quando a Activity é criada
   * Inicia a detecção de dispositivos USB
   */
  override fun onCreate(owner: LifecycleOwner) {
    Log.i(TAG, "onCreate")
    super.onCreate(owner)
    detectUsbDevices()
  }

  /**
   * Chamado quando a Activity é destruída
   * Desregistra o receptor de broadcast e fecha a porta serial
   */
  override fun onDestroy(owner: LifecycleOwner) {
    Log.i(TAG, "onDestroy")
    super.onDestroy(owner)
    try {
      // Desregistra o receptor de broadcast USB para evitar callbacks repetidos
      context.unregisterReceiver(usbReceiver)
      // Fecha a porta serial se estiver aberta
      if (port?.isOpen == true) {
        port?.close()
        onBoardDisconnect?.invoke(currentDevice)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Erro ao limpar recursos: ${e.message}")
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
   * Lista os dispositivos conectados e conecta apenas aos dispositivos suportados
   * Evita chamadas duplicadas durante o processo de conexão
   */
  fun detectUsbDevices() {
    // Evita chamadas duplicadas durante o processo de conexão
    if (isConnecting) {
      Log.i(TAG, "detectUsbDevices - Já existe uma conexão em andamento")
      return
    }
    
    isConnecting = true
    
    usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    val deviceList = usbManager.deviceList

    // Verificar se já existe um dispositivo conectado
    if (currentDevice != null) {
      // Já temos um dispositivo conectado, então conecte a ele
      approveDevice(currentDevice!!)
      return
    }

    // Se não houver um dispositivo conectado, procurar por novos dispositivos
    val supportedDevice: UsbDevice? = deviceList.values.filter {
      supportedManufacturers.contains(it.manufacturerName) || supportedProducts.contains(it.productId)
    }.getOrNull(0)

    Log.i(TAG, "detectUsbDevices - deviceList =  ${deviceList.size}")

    if (supportedDevice != null) approveDevice(supportedDevice)
    else if (deviceList.isNotEmpty()) {
      isConnecting = false
      onStatusChanges?.invoke(ConnectionStatus.Approve(usbDevices = deviceList.values.toList()))
    } else {
      isConnecting = false
      throwError(ConnectionError.NO_DEVICES)
    }
  }


  fun getUsbConnected() {
    usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    val deviceList = usbManager.deviceList

    // Verificar se já existe um dispositivo conectado
    if (currentDevice != null) {
      // Já temos um dispositivo conectado, então conecte a ele
      approveDevice(currentDevice!!)
      return
    }

    val supportedDevice: UsbDevice? = deviceList.values.filter {
      supportedManufacturers.contains(it.manufacturerName) || supportedProducts.contains(it.productId)
    }.getOrNull(0)

    Log.i(TAG, "detectUsbDevices - deviceList =  ${deviceList.size}")

    if (supportedDevice != null) approveDevice(supportedDevice)
    else if (deviceList.isNotEmpty()) onStatusChanges?.invoke(
      ConnectionStatus.Approve(usbDevices = deviceList.values.toList())
    ) else throwError(ConnectionError.NO_DEVICES)
  }

  fun approveDevice(usbDevice: UsbDevice) {
    Log.i(TAG, "supportedDevice - $usbDevice")
    currentDevice = usbDevice
    if (usbManager.hasPermission(usbDevice)) connectToSerial(usbDevice)
    else requestUsbPermission(usbDevice)
  }


  fun onDenyDevice() {
    throwError(error = ConnectionError.NOT_SUPPORTED)
  }

  fun onDisconnectDevice() {
    currentDevice = null
    throwError(error = ConnectionError.CONNECTION_LOST)
  }

  fun onForgetDevice(device: UsbDevice) {
    onDisconnectDevice()
    removeProduct(device.productId)
    detectUsbDevices()
  }

  @SuppressLint("UnspecifiedRegisterReceiverFlag")
  private fun requestUsbPermission(usbDevice: UsbDevice) {
    Log.i(TAG, "requestUsbPermission")

    val permissionIntent = PendingIntent.getBroadcast(
      context,
      0,
      Intent(ACTION_USB_PERMISSION).apply { `package` = context.packageName },
      if (SDK_INT >= 31) FLAG_MUTABLE or FLAG_UPDATE_CURRENT
      else 0
    )
    val filter = IntentFilter(ACTION_USB_PERMISSION)

    if (SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else context.registerReceiver(usbReceiver, filter)

    permissionGranted = false
    usbManager.requestPermission(usbDevice, permissionIntent)
  }

  private val usbReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      Log.i(TAG, "onReceive")
      if (permissionGranted || isPortOpen) return
      if (ACTION_USB_PERMISSION == intent.action) {
        synchronized(this) {
          Log.i("ExpoMicroIdeModule", "syncronized")
          Log.d(TAG, "synchronized-onReceive")
          val device: UsbDevice = intent.parcelable(UsbManager.EXTRA_DEVICE) ?: return
          if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
            permissionGranted = true
            connectToSerial(device)
          } else {
            throwError(ConnectionError.PERMISSION_DENIED)
          }
        }
      }
    }
  }

  /**
   * Make a serial connection to a usb device
   */
  /**
   * Estabelece uma conexão serial com o dispositivo USB
   * 
   * @param usbDevice O dispositivo USB para conectar
   */
  private fun connectToSerial(usbDevice: UsbDevice) {
    try {
      val customProber = UsbSerialProber(ProbeTable().apply {
        addProduct(usbDevice.vendorId, usbDevice.productId, CdcAcmSerialDriver::class.java)
      })

      val allDrivers = customProber.findAllDrivers(usbManager)

      if (allDrivers.isNullOrEmpty()) {
        Log.e(TAG, "Nenhum driver encontrado para o dispositivo USB.")
        throwError(ConnectionError.NO_DRIVER_FOUND, "Nenhum driver encontrado para o dispositivo")
        return
      }

      Log.i(TAG, "Drivers encontrados: $allDrivers")

      val ports = allDrivers[0].ports
      if (ports.isEmpty()) {
        Log.e(TAG, "Nenhuma porta serial encontrada.")
        throwError(ConnectionError.NO_PORT_FOUND, "Nenhuma porta serial encontrada")
        return
      }

      val connection = usbManager.openDevice(usbDevice)
      if (connection == null) {
        Log.e(TAG, "Falha ao abrir conexão com o dispositivo USB.")
        throwError(ConnectionError.CANT_OPEN_CONNECTION, "Falha ao abrir conexão com o dispositivo")
        return
      }

      Log.i(TAG, "Conexão estabelecida: $connection")

      port = ports[0]
      Log.i(TAG, "Porta selecionada: $port")

      try {
        port?.open(connection)
        port?.dtr = true
      } catch (e: Exception) {
        Log.e(TAG, "Erro ao abrir a porta serial: ${e.message}")
        throwError(ConnectionError.CANT_OPEN_PORT, e.message ?: "")
        return
      }

      // Definir parâmetros da conexão serial
      port?.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)

      // Iniciar o gerenciador de I/O serial
      serialInputOutputManager = SerialInputOutputManager(port, this)
      Thread(serialInputOutputManager).start()

      if (port?.isOpen == true) {
        Log.i(TAG, "Porta aberta com sucesso.")
        isConnecting = false
        onStatusChanges?.invoke(ConnectionStatus.Connected(usbDevice))
        onBoardConnect?.invoke(usbDevice)
        storeProductId(usbDevice.productId)
      } else {
        Log.e(TAG, "Erro ao abrir a porta serial.")
        throwError(ConnectionError.CANT_OPEN_PORT, "Porta não pôde ser aberta")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Erro inesperado ao conectar: ${e.message}")
      throwError(ConnectionError.UNEXPECTED_ERROR, e.message ?: "")
    }
  }

  override fun onNewData(bytes: ByteArray?) {
    val data = bytes?.toString(Charsets.UTF_8).orEmpty()
    // when writeSync is called, we need to collect all outputs
    // of onNewData and append them to a string builder
    // finally with isDone = true, response is returned to writeSync method
    when (executionMode) {
      ExecutionMode.SCRIPT -> {
        syncData.append(data)
        Log.v(TAG, "$ $data")
        val isDone =
          CommandsManager.isSilentExecutionDone(data) || CommandsManager.isSilentExecutionDone(syncData.toString())
        Log.v(TAG, "syncData - $syncData")
        Log.i(TAG, "isDone = $isDone")
        if (isDone) {
          Log.i(TAG, "syncData -\n$syncData")
          val result = CommandsManager.trimSilentResult(syncData.toString())
          onReadSync?.invoke(result)
        }
      }
      // in normal write mode, when micropython responses to commands
      // the output is echoed directly to onReceiveData callback
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

  /**
   * Método para tratar erros de conexão
   * 
   * @param error O tipo de erro que ocorreu
   * @param msg Mensagem de erro adicional (opcional)
   */
  private fun throwError(error: ConnectionError, msg: String = "") {
    if (port?.isOpen == true) port?.close()
    serialInputOutputManager?.stop()
    isConnecting = false
    
    // Notifica sobre o erro através dos callbacks
    onStatusChanges?.invoke(
      ConnectionStatus.Error(error = error.toString(), msg = msg)
    )
    onConnectionError?.invoke(error, msg)
    
    // Notifica sobre a desconexão se houver um dispositivo atual
    currentDevice?.let { device ->
      onBoardDisconnect?.invoke(device)
    }
    
    // Limpa o dispositivo atual
    currentDevice = null
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
