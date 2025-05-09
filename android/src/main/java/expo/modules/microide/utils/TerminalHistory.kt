package expo.modules.microide.utils

import android.util.Log

class TerminalHistory {
    companion object {
        private const val TAG = "TerminalHistory"
    }

    private var historyIndex = 0
    private val history = mutableListOf<String>()

    fun push(value: String) {
        Log.i(TAG, "push")
        if (history.contains(value).not()) {
            history.add(value)
            historyIndex = history.size - 1
        }
    }

    fun up(): String? {
        Log.i(TAG, "up----> ${history.size} | $historyIndex")
        return if (history.isNotEmpty() && historyIndex >= 0) history[historyIndex--] else null
    }

    fun down(): String? {
        Log.i(TAG, "down----> ${history.size} | $historyIndex")
        if (historyIndex == -1) historyIndex = 0
        if (historyIndex + 1 < history.size) historyIndex++
        return if (history.isNotEmpty()) history[historyIndex] else null
    }
}