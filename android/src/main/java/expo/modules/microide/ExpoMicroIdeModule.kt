package expo.modules.microide

import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.managers.FilesManager
import expo.modules.microide.managers.TerminalManager
import expo.modules.microide.utils.ConnectionError
import expo.modules.microide.utils.ConnectionStatus
import expo.modules.microide.utils.MicroFile
import expo.modules.microide.utils.toMicroDevice

class ExpoMicroIdeModule : Module() {

  private lateinit var boardManager: BoardManager
  private lateinit var filesManager: FilesManager
  private lateinit var terminalManager: TerminalManager

  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

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
        if (::filesManager.isInitialized) {
          filesManager.listDir { files ->
            Log.i("ExpoMicroIdeModule", "os arquivos $files")
            promise.resolve(files)
          }
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao listar arquivos: ${e.message}")
        promise.reject("LIST_FILES_ERROR", e.message, null)
      }
    }

    AsyncFunction("createFile") { name: String, promise: Promise ->
      try {
        if (::filesManager.isInitialized) {
          val newFile = MicroFile(name = name, path = filesManager.path)
          filesManager.new(newFile)
          promise.resolve("Arquivo criado com sucesso")
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao criar arquivo: ${e.message}")
        promise.reject("CREATE_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("deleteFile") { fileName: String, promise: Promise ->
      try {
        if (::filesManager.isInitialized) {
          val fileToDelete = MicroFile(name = fileName, path = filesManager.path)
          filesManager.remove(fileToDelete)
          promise.resolve("Arquivo deletado com sucesso")
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao deletar arquivo: ${e.message}")
        promise.reject("DELETE_FILE_ERROR", e.message, null)
      } 
    }

    AsyncFunction("renameFile") { oldName: String, newName: String, promise: Promise ->
      try {
        if (::filesManager.isInitialized) {
          val src = MicroFile(name = oldName, path = filesManager.path)
          val dst = MicroFile(name = newName, path = filesManager.path)
          filesManager.rename(src, dst)
          promise.resolve("Arquivo renomeado com sucesso")
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao renomear arquivo: ${e.message}")
        promise.reject("RENAME_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("readFile") { path: String, promise: Promise ->
      try {
        if (::filesManager.isInitialized) {
          filesManager.read(path) { content ->
            promise.resolve(content)
          }
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao ler arquivo: ${e.message}")
        promise.reject("READ_FILE_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("writeFile") { path: String, content: String, promise: Promise ->
      try {
        if (::filesManager.isInitialized) {
          filesManager.write(path, content) {
            promise.resolve("Conteúdo escrito com sucesso")
          }
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao escrever no arquivo: ${e.message}")
        promise.reject("WRITE_FILE_ERROR", e.message, null)
      }
    }

    AsyncFunction("pauseScript") { promise: Promise ->
      try {
        terminalManager.terminateExecution {
          promise.resolve("Execução do script pausada com sucesso")
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao pausar o script: ${e.message}")
        promise.reject("PAUSE_SCRIPT_ERROR", e.message, null)
      }
    }
    
    AsyncFunction("resetScript") { promise: Promise ->
      try {
        val microDevice = boardManager.currentDevice?.toMicroDevice()
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
    
    AsyncFunction("executeScript") { promise: Promise ->
      try {
        val code = "import main"
        terminalManager.executeScript(code) {
          promise.resolve("Script executado com sucesso")
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao executar o script: ${e.message}")
        promise.reject("EXECUTE_SCRIPT_ERROR", e.message, null)
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
      boardManager = BoardManager(
        context = context,
        onStatusChanges = { status ->
          when (status) {
            is ConnectionStatus.Connecting -> Log.i("ExpoMicroIdeModule", "Conectando...")
            is ConnectionStatus.Connected -> {
              val usbDevice = status.usbDevice
              val microDevice = usbDevice.toMicroDevice()
              Log.i("ExpoMicroIdeModule", "Placa conectada com sucesso! Dispositivo: ${microDevice.board}")
              initializeFilesManager()
              promise.resolve(microDevice.board)
            }

            is ConnectionStatus.Error -> {
              val errorMsg = when (status.error) {
                ConnectionError.NO_DEVICES.toString() -> "Nenhum dispositivo encontrado"
                ConnectionError.CONNECTION_LOST.toString() -> "Conexão perdida"
                ConnectionError.CANT_OPEN_PORT.toString() -> "Não foi possível abrir a porta"
                ConnectionError.PERMISSION_DENIED.toString() -> "Permissão negada"
                ConnectionError.NOT_SUPPORTED.toString() -> "Dispositivo não suportado"
                else -> {
                  "eita caralho"
                }
              }
              Log.e("ExpoMicroIdeModule", "Erro de conexão: $errorMsg")
              promise.reject("CONNECTION_ERROR", errorMsg, null)
            }

            else -> Unit
          }
        },
        onReceiveData = { data ->
          Log.i("ExpoMicroIdeModule", "Dados recebidos: $data")
        }
      )
      terminalManager = TerminalManager(boardManager)
      boardManager.detectUsbDevices()
    }
  }
  
  private fun initializeFilesManager() {
    filesManager = FilesManager(boardManager, onUpdateFiles = { files ->
      Log.i("ExpoMicroIdeModule", "Arquivos atualizados: $files")
    })
    filesManager.path = "/"
  }
}
