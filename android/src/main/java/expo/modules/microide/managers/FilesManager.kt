package expo.modules.microide.managers

import android.util.Log
import expo.modules.microide.managers.BoardManager
import expo.modules.microide.managers.CommandsManager
import expo.modules.microide.utils.MicroFile
import org.json.JSONArray
import org.json.JSONObject

class FilesManager(
  private val boardManager: BoardManager,
  private val onUpdateFiles: ((files: List<MicroFile>) -> Unit)? = null
) {

  companion object {
    private const val TAG = "FileManager"
  }

  /**
   * The current path being displayed.
   */
  var path = ""

  /**
   * Lists the files and directories in the current path.
   */
  fun listDir(onResult: (String) -> Unit) {
    val code = CommandsManager.iListDir(path)
    boardManager.writeInSilentMode(code, onResponse = { result ->
      decodeFiles(result)
      Log.i("ExpoMicroIdeModule", decodeFiles(result).toString())
      onResult(decodeFiles(result).toString())
    })
    boardManager.writeCommand("""
      import machine
      machine.reset()
    """.trimIndent())
  }


  /**
   * Removes the specified file or directory.
   *
   * @param file The file or directory to remove.
   */
  fun remove(file: MicroFile) {
    val code = if (file.isFile) CommandsManager.removeFile(file)
    else CommandsManager.removeDirectory(file)
    boardManager.writeInSilentMode(code, onResponse = { result ->
      decodeFiles(result)
    })
  }

  /**
   * Creates a new file or directory.
   *
   * @param file The file or directory to create.
   */
  fun new(file: MicroFile) {
    val code = if (file.isFile) CommandsManager.makeFile(file)
    else CommandsManager.makeDirectory(file)
    boardManager.writeInSilentMode(code, onResponse = { result ->
      decodeFiles(result)
    })
  }

  /**
   * Renames the specified file or directory.
   *
   * @param src The original file or directory.
   * @param dst The new name for the file or directory.
   */
  fun rename(src: MicroFile, dst: MicroFile) {
    val code = CommandsManager.rename(src, dst)
    boardManager.writeInSilentMode(code, onResponse = { result ->
      decodeFiles(result)
    })
  }

  /**
   * Reads the contents of the specified file.
   *
   * @param path The path to the file.
   * @param onRead A callback function that will be invoked with the contents of the file.
   */
  fun read(path: String, onRead: (content: String) -> Unit) {
    val code = CommandsManager.readFile(path)
    boardManager.writeInSilentMode(code, onResponse = { result ->
      onRead.invoke(result)
    })
  }

  /**
   * Writes the specified content to the specified file.
   *
   * @param path The path to the file.
   * @param content The content to write to the file.
   * @param onSave A callback function that will be invoked when the file has been saved.
   */
  fun write(path: String, content: String, onSave: () -> Unit) {
    val code = CommandsManager.writeFile(path, content)
    boardManager.writeInSilentMode(code, onResponse = { result ->
      Log.i(TAG, "result $result")
      onSave.invoke()
    })
  }

  /**
   * Decodes the JSON response from the board manager into a list of MicroFile objects.
   *
   * @param json The JSON response from the board manager.
   */
  private fun decodeFiles(json: String): JSONArray {
    val formattedJson = json.replace("(", "[").replace(")", "]")  // Corrige o formato
    val items = JSONArray(formattedJson)
    val fileList = JSONArray()

    for (i in 0 until items.length()) {
      val item = items.getJSONArray(i)
      if (item.length() >= 3) {
        val fileObject = JSONObject().apply {
          put("name", item.getString(0))
          put("type", item.getInt(1))
          put("size", item.optInt(3, 0))
        }
        fileList.put(fileObject)
      }
    }

    Log.i(TAG, fileList.toString())
//    onUpdateFiles?.invoke(fileList.toKotlinList())
    return fileList
  }

  // Função de extensão para converter JSONArray em List<JSONObject>
  private fun JSONArray.toKotlinList(): List<JSONObject> {
    val list = mutableListOf<JSONObject>()
    for (i in 0 until this.length()) {
      list.add(this.getJSONObject(i))
    }
    return list
  }
//  private fun decodeFiles(json: String) {
//    val list = mutableListOf<MicroFile>()
//    val jsonFormated = json.replace("(", "[").replace(")", "]")
//    val items: JSONArray?
//    try {
//      items = JSONArray(jsonFormated)
//    } catch (e: Exception) {
//      e.printStackTrace()
//      return
//    }
//    for (i in 0 until items.length()) {
//      val item = items[i] as? JSONArray ?: continue
//      val length = item.length()
//
//      if (length >= 3) {
//        val name = (item[0] as? String).orEmpty()
//        val type = (item[1] as? Int) ?: 0x8000
//        val size = if (length == 4) ((item[3] as? Int) ?: 0)
//        else 0
//        list.add(MicroFile(name = name, path = this.path, type = type, size = size))
//      }
//    }
//    Log.i(TAG, list.toString())
//    onUpdateFiles?.invoke(list)
//  }
}
