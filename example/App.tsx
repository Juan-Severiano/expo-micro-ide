import * as ExpoMicroIde from "expo-micro-ide";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View, FlatList } from "react-native";

export default function App() {
  const [board, setBoard] = useState("")
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<ExpoMicroIde.MicroFile[]>([]);

  async function connect() {
    try {
      const res = await ExpoMicroIde.initialize();
      setStatus(`Conectado: ${res}`);
      setBoard(res)
      await list()
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
    await ExpoMicroIde.files.create(fileName);
    await list();
    setStatus(`Arquivo '${fileName}' criado`);
    clearFields()
  }

  async function deleteFile() {
    if (!fileName) return setStatus("Nome do arquivo é necessário para deletar");
    await ExpoMicroIde.files.remove(fileName);
    await list();
    setStatus(`Arquivo '${fileName}' deletado`);
    clearFields()
  }

  async function renameFile(newName: string) {
    if (!fileName) return setStatus("Nome do arquivo é necessário para renomear");
    await ExpoMicroIde.files.rename(fileName, newName);
    await list();
    setStatus(`Arquivo '${fileName}' renomeado para '${newName}'`);
    clearFields()
  }

  async function readFile() {
    if (!fileName) return setStatus("Nome do arquivo é necessário para leitura");
    const content = await ExpoMicroIde.files.read(fileName);
    setContent(content);
    setStatus(`Conteúdo do arquivo '${fileName}' lido`);
  }

  async function writeFile() {
    if (!fileName) return setStatus("Nome do arquivo é necessário para escrita");
    await ExpoMicroIde.files.write(fileName, content);
    setStatus(`Conteúdo escrito no arquivo '${fileName}'`);
    clearFields()
  }

  function clearFields() {
    setContent("")
    setFileName("")
  }

  return (
    <View style={styles.container}>
      {
        board && (
          <Text>Conectado a {board}</Text>
        )
      }
      <Text>{status}</Text>
      <Button title="Detectar Dispositivo" onPress={connect} />
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
      />
      <Button title="Limpar campos" onPress={clearFields} />
      <Button title="Listar files" onPress={list} />
      <Button title="Criar Arquivo" onPress={createFile} />
      <Button title="Deletar Arquivo" onPress={deleteFile} />
      <Button title="Renomear Arquivo" onPress={() => renameFile("novoNome.txt")} />
      <Button title="Ler Arquivo" onPress={readFile} />
      <Button title="Escrever no Arquivo" onPress={writeFile} />


      <Button title="EXCECUTA CARALHO" onPress={ExpoMicroIde.board.run} />

      <Text>Arquivos:</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name} - {item.size} bytes</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  input: {
    width: "100%",
    padding: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
});
