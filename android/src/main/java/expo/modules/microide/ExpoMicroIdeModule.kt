package expo.modules.microide

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.managers.FilesManager
import expo.modules.microide.utils.ConnectionError
import expo.modules.microide.utils.ConnectionStatus

class ExpoMicroIdeModule : Module() {

  private lateinit var boardManager: BoardManager
  private lateinit var filesManager: FilesManager

  override fun definition() = ModuleDefinition {
    Name("ExpoMicroIde")

    Function("hello") {
      return@Function "Hello world Kotlin + Expo Modules! 👋"
    }

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
          filesManager.listDir()
          promise.resolve("Arquivos listados com sucesso")
        } else {
          promise.reject("FILES_MANAGER_NOT_INITIALIZED", "FilesManager não inicializado", null)
        }
      } catch (e: Exception) {
        Log.e("ExpoMicroIdeModule", "Erro ao listar arquivos: ${e.message}")
        promise.reject("LIST_FILES_ERROR", e.message, null)
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
              Log.i("ExpoMicroIdeModule", "Placa conectada com sucesso!")
              initializeFilesManager()
              promise.resolve("Placa conectada com sucesso")
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
