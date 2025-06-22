import * as ExpoMicroIde from "expo-micro-ide";
import React, { useState, useEffect } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  ScrollView,
} from "react-native";

export default function App() {
  const [boardId, setBoardId] = useState("");
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<ExpoMicroIde.MicroFile[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ExpoMicroIde.ConnectionStatus>(
      ExpoMicroIde.ConnectionStatus.DISCONNECTED,
    );
  const [boardStatus, setBoardStatus] = useState<ExpoMicroIde.BoardStatus>(
    ExpoMicroIde.BoardStatus.STOPPED,
  );

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribeConnection = ExpoMicroIde.board.onConnectionChange(
      (status) => {
        setConnectionStatus(status);
        setStatus(`Status de conexão: ${status}`);
      },
    );

    const unsubscribeBoard = ExpoMicroIde.board.onStatusChange((status) => {
      setBoardStatus(status);
      setStatus(`Status do board: ${status}`);
    });

    return () => {
      unsubscribeConnection();
      unsubscribeBoard();
    };
  }, []);

  async function connect() {
    try {
      const res = await ExpoMicroIde.board.initialize();
      setStatus(`Conectado: ${res}`);
      setBoardId(res);
      await list();
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro: ${error?.message}`);
    }
  }

  async function list() {
    try {
      const fileList = await ExpoMicroIde.files.list();
      setFiles(fileList);
      setStatus(`Arquivos listados: ${fileList.length}`);
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao listar arquivos: ${error?.message}`);
    }
  }

  async function createFile() {
    if (!fileName) return setStatus("Nome do arquivo é necessário");
    try {
      await ExpoMicroIde.files.create(fileName);
      await list();
      setStatus(`Arquivo '${fileName}' criado`);
      clearFields();
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao criar arquivo: ${error?.message}`);
    }
  }

  async function deleteFile() {
    if (!fileName)
      return setStatus("Nome do arquivo é necessário para deletar");
    try {
      await ExpoMicroIde.files.remove(fileName);
      await list();
      setStatus(`Arquivo '${fileName}' deletado`);
      clearFields();
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao deletar arquivo: ${error?.message}`);
    }
  }

  async function renameFile(newName: string) {
    if (!fileName)
      return setStatus("Nome do arquivo é necessário para renomear");
    try {
      await ExpoMicroIde.files.rename(fileName, newName);
      await list();
      setStatus(`Arquivo '${fileName}' renomeado para '${newName}'`);
      clearFields();
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao renomear arquivo: ${error?.message}`);
    }
  }

  async function readFile() {
    if (!fileName)
      return setStatus("Nome do arquivo é necessário para leitura");
    try {
      const fileContent = await ExpoMicroIde.files.read(fileName);
      setContent(fileContent);
      setStatus(`Conteúdo do arquivo '${fileName}' lido`);
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao ler arquivo: ${error?.message}`);
    }
  }

  async function writeFile() {
    if (!fileName)
      return setStatus("Nome do arquivo é necessário para escrita");
    try {
      await ExpoMicroIde.files.write(fileName, content);
      setStatus(`Conteúdo escrito no arquivo '${fileName}'`);
      clearFields();
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao escrever arquivo: ${error?.message}`);
    }
  }

  async function runScript() {
    try {
      const result = await ExpoMicroIde.board.run();
      setStatus(`Script executado: ${result}`);
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao executar script: ${error?.message}`);
    }
  }

  async function pauseScript() {
    try {
      const result = await ExpoMicroIde.board.pause();
      setStatus(`Script pausado: ${result}`);
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao pausar script: ${error?.message}`);
    }
  }

  async function resetBoard() {
    try {
      const result = await ExpoMicroIde.board.reset();
      setStatus(`Board resetado: ${result}`);
    } catch (error) {
      // @ts-ignore
      setStatus(`Erro ao resetar board: ${error?.message}`);
    }
  }

  function clearFields() {
    setContent("");
    setFileName("");
  }

  function getLastOutput() {
    const output = ExpoMicroIde.board.getLastOutput();
    setStatus(`Último output: ${output}`);
  }

  return (
    <ScrollView style={styles.container}>
      {boardId && <Text style={styles.boardInfo}>Conectado a: {boardId}</Text>}

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Conexão: {connectionStatus}</Text>
        <Text style={styles.statusText}>Board: {boardStatus}</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conexão</Text>
        <Button title="Detectar Dispositivo" onPress={connect} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Arquivos</Text>
        <TextInput
          placeholder="Nome do arquivo"
          value={fileName}
          onChangeText={setFileName}
          style={styles.input}
        />
        <TextInput
          placeholder="Conteúdo do arquivo"
          value={content}
          onChangeText={setContent}
          style={styles.input}
          multiline
        />
        <View style={styles.buttonRow}>
          <Button title="Limpar" onPress={clearFields} />
          <Button title="Listar" onPress={list} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Criar" onPress={createFile} />
          <Button title="Deletar" onPress={deleteFile} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Renomear" onPress={() => renameFile("novoNome.txt")} />
          <Button title="Ler" onPress={readFile} />
        </View>
        <Button title="Escrever" onPress={writeFile} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Execução</Text>
        <View style={styles.buttonRow}>
          <Button title="Executar Script" onPress={runScript} />
          <Button title="Pausar" onPress={pauseScript} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Reset Board" onPress={resetBoard} />
          <Button title="Ver Output" onPress={getLastOutput} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Arquivos no dispositivo:</Text>
        <FlatList
          data={files}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <View style={styles.fileItem}>
              <Text style={styles.fileName}>{item.name}</Text>
              <Text style={styles.fileDetails}>
                {item.size} bytes -{" "}
                {item.type === ExpoMicroIde.FileType.DIRECTORY
                  ? "Pasta"
                  : "Arquivo"}
              </Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  boardInfo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007AFF",
  },
  statusContainer: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 5,
  },
  fileItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
  },
  fileDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
