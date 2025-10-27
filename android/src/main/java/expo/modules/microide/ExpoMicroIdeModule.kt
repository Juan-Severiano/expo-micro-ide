package expo.modules.microide

import android.hardware.usb.UsbDevice
import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.AnyType
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.managers.CommandsManager
import expo.modules.microide.managers.FilesManager
import expo.modules.microide.managers.TerminalManager
import expo.modules.microide.utils.ConnectionError
import expo.modules.microide.utils.ConnectionStatus
import expo.modules.microide.utils.MicroFile
import expo.modules.microide.utils.toMicroDevice

class ExpoMicroIdeModule : Module() {

  private var boardManager: BoardManager? = null

  private val filesManager: FilesManager by lazy {
    FilesManager(boardManager!!, onUpdateFiles = { files ->
      Log.i("ExpoMicroIdeModule", "Arquivos atualizados: $files")
      sendEvent("onFilesUpdate", mapOf("files" to files))
    }).apply {
      path = "/"
    }
  }

  private val terminalManager: TerminalManager by lazy {
    TerminalManager(boardManager!!)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")
    
    Events(
      "onStatusChanges",
      "onReceiveData",
      "onBoardConnect",
      "onBoardDisconnect",
      "onConnectionError",
      "onFilesUpdate"
    )

    AsyncFunction("initialize") { promise: Promise ->
      try {
        Log.i("ExpoMicroIdeModule", "Iniciando conexão com a placa...")
        initializeBoardManager(promise)
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao iniciar: ${e.message}")
        promise.reject("INITIALIZE_ERROR", e.message, null)
      }
    }

    AsyncFunction("listFiles") { promise: Promise ->
      try {
        if (boardManager != null) {
          filesManager.listDir { files ->
            Log.i("ExpoMicroIdeModule", "os arquivos $files")
            promise.resolve(files)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao listar arquivos: ${e.message}")
        promise.reject("LIST_FILES_ERROR", e.message, null)
      }
    }

    AsyncFunction("createFile") { name: String, promise: Promise ->
      try {
        if (boardManager != null) {
          val newFile = MicroFile(name = name, path = filesManager.path)
          filesManager.new(newFile)
          promise.resolve("Arquivo criado com sucesso")
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao criar arquivo: ${e.message}")
        promise.reject("CREATE_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("deleteFile") { fileName: String, promise: Promise ->
      try {
        if (boardManager != null) {
          val fileToDelete = MicroFile(name = fileName, path = filesManager.path)
          filesManager.remove(fileToDelete)
          promise.resolve("Arquivo deletado com sucesso")
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao deletar arquivo: ${e.message}")
        promise.reject("DELETE_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("renameFile") { oldName: String, newName: String, promise: Promise ->
      try {
        if (boardManager != null) {
          val src = MicroFile(name = oldName, path = filesManager.path)
          val dst = MicroFile(name = newName, path = filesManager.path)
          filesManager.rename(src, dst)
          promise.resolve("Arquivo renomeado com sucesso")
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao renomear arquivo: ${e.message}")
        promise.reject("RENAME_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("readFile") { path: String, promise: Promise ->
      try {
        if (boardManager != null) {
          filesManager.read(path) { content ->
            promise.resolve(content)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao ler arquivo: ${e.message}")
        promise.reject("READ_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("writeFile") { path: String, content: String, promise: Promise ->
      try {
        if (boardManager != null) {
          filesManager.write(path, content) {
            promise.resolve("Conteúdo escrito com sucesso")
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao escrever no arquivo: ${e.message}")
        promise.reject("WRITE_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("pauseScript") { promise: Promise ->
      try {
        if (boardManager != null) {
          terminalManager.terminateExecution {
            promise.resolve("Execução do script pausada com sucesso")
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao pausar o script: ${e.message}")
        promise.reject("PAUSE_SCRIPT_ERROR", e.message, null)
      }
    }

    AsyncFunction("resetScript") { promise: Promise ->
      try {
        val microDevice = boardManager?.currentDevice?.toMicroDevice()
        if (microDevice != null) {
          terminalManager.resetDevice(microDevice) {
            promise.resolve("Script resetado com sucesso")
          }
        } else {
          promise.reject("RESET_SCRIPT_ERROR", "Dispositivo não encontrado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao resetar o script: ${e.message}")
        promise.reject("RESET_SCRIPT_ERROR", e.message, null)
      }
    }

    AsyncFunction("executeScript") { code: String, promise: Promise ->
      try {
        if (boardManager != null) {
          terminalManager.executeScript(code) {
            promise.resolve("Script executado com sucesso")
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao executar o script: ${e.message}")
        promise.reject("EXECUTE_SCRIPT_ERROR", e.message, null)
      }
    }

    AsyncFunction("executeMain") { promise: Promise ->
      try {
        if (boardManager != null) {
          val code = "import main"
          terminalManager.executeScript(code) {
            promise.resolve("Script executado com sucesso")
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao executar o script: ${e.message}")
        promise.reject("EXECUTE_SCRIPT_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("detectUsbDevices") { promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.detectUsbDevices()
          promise.resolve(true)
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao detectar dispositivos USB: ${e.message}")
        promise.reject("DETECT_USB_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("approveDevice") { deviceId: String, promise: Promise ->
      try {
        if (boardManager != null) {
          val usbManager = appContext.currentActivity?.getSystemService(android.content.Context.USB_SERVICE) as? android.hardware.usb.UsbManager
          if (usbManager != null) {
            val deviceList = usbManager.deviceList
            val device = deviceList[deviceId]
            if (device != null) {
              boardManager?.approveDevice(device)
              promise.resolve(true)
            } else {
              promise.reject("DEVICE_NOT_FOUND", "Dispositivo não encontrado", null)
            }
          } else {
            promise.reject("USB_MANAGER_ERROR", "Erro ao acessar o gerenciador USB", null)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao aprovar dispositivo: ${e.message}")
        promise.reject("APPROVE_DEVICE_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("disconnectDevice") { promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.onDisconnectDevice()
          promise.resolve(true)
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao desconectar dispositivo: ${e.message}")
        promise.reject("DISCONNECT_DEVICE_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("forgetDevice") { promise: Promise ->
      try {
        if (boardManager != null) {
          val currentDevice = boardManager?.currentDevice
          if (currentDevice != null) {
            boardManager?.onForgetDevice(currentDevice)
            promise.resolve(true)
          } else {
            promise.reject("NO_DEVICE_CONNECTED", "Nenhum dispositivo conectado", null)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao esquecer dispositivo: ${e.message}")
        promise.reject("FORGET_DEVICE_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("sendCommand") { command: String, promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.write(command) {
            promise.resolve(true)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao enviar comando: ${e.message}")
        promise.reject("SEND_COMMAND_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("sendCommandInSilentMode") { command: String, promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.writeInSilentMode(command) { response ->
            promise.resolve(response)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao enviar comando em modo silencioso: ${e.message}")
        promise.reject("SEND_SILENT_COMMAND_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("getCurrentDevice") { promise: Promise ->
      try {
        if (boardManager != null) {
          val device = boardManager?.currentDevice
          if (device != null) {
            val microDevice = device.toMicroDevice()
            promise.resolve(mapOf(
              "name" to microDevice.board,
              "port" to microDevice.port,
              "vendorId" to device.vendorId,
              "productId" to device.productId,
              "isMicroPython" to microDevice.isMicroPython
            ))
          } else {
            promise.resolve(null)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao obter dispositivo atual: ${e.message}")
        promise.reject("GET_CURRENT_DEVICE_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("sendCtrlC") { promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.writeCommand(CommandsManager.CTRL_C) {
            promise.resolve(true)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao enviar CTRL+C: ${e.message}")
        promise.reject("SEND_CTRL_C_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("sendCtrlD") { promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.writeCommand(CommandsManager.CTRL_D) {
            promise.resolve(true)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao enviar CTRL+D: ${e.message}")
        promise.reject("SEND_CTRL_D_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("resetBoard") { promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.writeCommand(CommandsManager.RESET) {
            promise.resolve(true)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao resetar a placa: ${e.message}")
        promise.reject("RESET_BOARD_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("enterSilentMode") { promise: Promise ->
      try {
        if (boardManager != null) {
          boardManager?.writeCommand(CommandsManager.SILENT_MODE) {
            promise.resolve(true)
          }
        } else {
          promise.reject("BOARD_MANAGER_NOT_INITIALIZED", "BoardManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao entrar no modo silencioso: ${e.message}")
        promise.reject("ENTER_SILENT_MODE_ERROR", e.message, null)
      }
    }
  }

  private fun initializeBoardManager(promise: Promise) {
    val context = appContext.currentActivity ?: run {
      promise.reject("CONTEXT_ERROR", "Contexto não disponível", null)
      return
    }
    val handler = Handler(Looper.getMainLooper())
    handler.post {
      var settled = false
      boardManager = BoardManager(
        context = context,
        onStatusChanges = { status ->
          when (status) {
            is ConnectionStatus.Connecting -> {
              Log.i("ExpoMicroIdeModule", "Conectando...")
              sendEvent("onStatusChanges", mapOf("status" to "connecting"))
            }
            is ConnectionStatus.Connected -> {
              val usbDevice = status.usbDevice
              val microDevice = usbDevice.toMicroDevice()
              Log.i("ExpoMicroIdeModule", "Placa conectada com sucesso! Dispositivo: ${microDevice.board}")
              
              sendEvent("onStatusChanges", mapOf(
                "status" to "connected",
                "device" to mapOf(
                  "name" to microDevice.board,
                  "port" to microDevice.port,
                  "isMicroPython" to microDevice.isMicroPython
                )
              ))
              
              filesManager.listDir { }
              if (!settled) {
                settled = true
                promise.resolve(microDevice.board)
              } else {
                Log.w("ExpoMicroIdeModule", "initialize promise already settled; ignoring duplicate resolve")
              }
            }

            is ConnectionStatus.Error -> {
              val errorMsg = when (status.error) {
                ConnectionError.NO_DEVICES.toString() -> "Nenhum dispositivo encontrado"
                ConnectionError.CONNECTION_LOST.toString() -> "Conexão perdida"
                ConnectionError.CANT_OPEN_PORT.toString() -> "Não foi possível abrir a porta"
                ConnectionError.PERMISSION_DENIED.toString() -> "Permissão negada"
                ConnectionError.NOT_SUPPORTED.toString() -> "Dispositivo não suportado"
                ConnectionError.NO_DRIVER_FOUND.toString() -> "Nenhum driver encontrado para o dispositivo"
                ConnectionError.NO_PORT_FOUND.toString() -> "Nenhuma porta serial encontrada"
                ConnectionError.CANT_OPEN_CONNECTION.toString() -> "Não foi possível abrir a conexão"
                ConnectionError.UNEXPECTED_ERROR.toString() -> "Erro inesperado na conexão"
                else -> "Erro desconhecido na conexão"
              }
              
              sendEvent("onStatusChanges", mapOf(
                "status" to "error",
                "error" to status.error,
                "message" to status.msg
              ))
              
              Log.e("ExpoMicroIdeModule", "Erro de conexão: $errorMsg")
              if (!settled) {
                settled = true
                promise.reject("CONNECTION_ERROR", errorMsg, null)
              } else {
                Log.w("ExpoMicroIdeModule", "initialize promise already settled; ignoring duplicate reject")
              }
            }

            is ConnectionStatus.Approve -> {
              sendEvent("onStatusChanges", mapOf(
                "status" to "approve",
                "devices" to status.usbDevices.filterNotNull().map { device ->
                  mapOf(
                    "vendorId" to device.vendorId,
                    "productId" to device.productId,
                    "deviceName" to device.deviceName,
                    "manufacturerName" to (device.manufacturerName ?: "Unknown"),
                    "productName" to (device.productName ?: "Unknown")
                  )
                }
              ))
            }
          }
        },
        onReceiveData = { data ->
          Log.i("ExpoMicroIdeModule", "Dados recebidos: $data")
          sendEvent("onReceiveData", mapOf("data" to data))
        },
        onBoardConnect = { device ->
          Log.i("ExpoMicroIdeModule", "Dispositivo conectado: ${device.deviceName}")
          val microDevice = device.toMicroDevice()
          sendEvent("onBoardConnect", mapOf(
            "device" to mapOf(
              "name" to microDevice.board,
              "port" to microDevice.port,
              "vendorId" to device.vendorId,
              "productId" to device.productId,
              "isMicroPython" to microDevice.isMicroPython
            )
          ))
        },
        onBoardDisconnect = { device ->
          Log.i("ExpoMicroIdeModule", "Dispositivo desconectado: ${device?.deviceName}")
          device?.let {
            val microDevice = it.toMicroDevice()
            sendEvent("onBoardDisconnect", mapOf(
              "device" to mapOf(
                "name" to microDevice.board,
                "port" to microDevice.port
              )
            ))
          } ?: sendEvent("onBoardDisconnect", mapOf("device" to null))
        },
        onConnectionError = { error, message ->
          Log.e("ExpoMicroIdeModule", "Erro de conexão: $error - $message")
          sendEvent("onConnectionError", mapOf(
            "error" to error.toString(),
            "message" to message
          ))
        }
      )
      boardManager?.detectUsbDevices()
    }
  }
}