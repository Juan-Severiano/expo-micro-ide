import * as ExpoMicroIde from "expo-micro-ide";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function App() {
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<{ [key: string]: string }>({});

  async function connect() {
    try {
      console.log("Clicou em detectar dispositivos");
      const res = await ExpoMicroIde.initialize();
      setStatus(res as string);
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setStatus("Erro ao conectar: " + error?.message);
    }
  }

  async function list() {
    try {
      console.log("Clicou em listar arquivos");
      const res = await ExpoMicroIde.listFiles();
      console.log(res);
      if (Object.keys(files).length > 0) {
        setStatus("Arquivos: " + JSON.stringify(Object.keys(files)));
      } else {
        setStatus("Nenhum arquivo encontrado");
      }
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setStatus("Erro ao listar arquivos: " + error?.message);
    }
  }

  async function createFile() {
    if (!fileName) {
      setStatus("Nome do arquivo é necessário");
      return;
    }
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileName]: "",
    }));
    await ExpoMicroIde.createFile(fileName)
    setStatus(`Arquivo '${fileName}' criado`);
  }

  async function deleteFile() {
    if (!fileName) {
      setStatus("Nome do arquivo é necessário para deletar");
      return;
    }
    setFiles(prevFiles => {
      const updatedFiles = { ...prevFiles };
      if (fileName in updatedFiles) {
        delete updatedFiles[fileName];
        setStatus(`Arquivo '${fileName}' deletado`);
      } else {
        setStatus("Arquivo não encontrado");
      }
      return updatedFiles;
    });
    await ExpoMicroIde.deleteFile("asd.py")
  }

  async function renameFile(newName: string) {
    if (!fileName || !newName) {
      setStatus("Nome do arquivo atual e novo nome são necessários para renomear");
      return;
    }
    setFiles(prevFiles => {
      const updatedFiles = { ...prevFiles };
      if (fileName in updatedFiles) {
        updatedFiles[newName] = updatedFiles[fileName];
        delete updatedFiles[fileName];
        setStatus(`Arquivo '${fileName}' renomeado para '${newName}'`);
      } else {
        setStatus("Arquivo não encontrado");
      }
      return updatedFiles;
    });
    await ExpoMicroIde.renameFile("q.py", "juan.py")
  }

  async function readFile() {
    if (!fileName) {
      setStatus("Nome do arquivo é necessário para leitura");
      return;
    }
    const fileContent = files[fileName];
    if (fileContent !== undefined) {
      setContent(fileContent);
      setStatus(`Conteúdo do arquivo '${fileName}': ${fileContent}`);
    } else {
      setStatus("Arquivo não encontrado");
    }
    const cont = await ExpoMicroIde.readFile("/main.py")
    if (typeof cont === "string") {
      setContent(cont)
    }
  }

  async function writeFile() {
    if (!fileName) {
      setStatus("Nome do arquivo é necessário para escrita");
      return;
    }
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileName]: content,
    }));
    setStatus(`Conteúdo escrito no arquivo '${fileName}'`);
  }

  return (
    <View style={styles.container}>
      <Text>Status: {status}</Text>
      <Button title="Detectar Dispositivos" onPress={connect} />
      <Button title="Listar Arquivos" onPress={list} />
      <TextInput
        value={fileName}
        onChangeText={setFileName}
        style={styles.input}
        placeholder="Nome do arquivo"
      />
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Conteúdo do arquivo"
        style={styles.input}
      />
      <Button title="Criar Arquivo" onPress={createFile} />
      <Button title="Deletar Arquivo" onPress={deleteFile} />
      <Button title="Renomear Arquivo" onPress={() => renameFile("novoNome")} />
      <Button title="Ler Arquivo" onPress={readFile} />
      <Button title="Escrever no Arquivo" onPress={writeFile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: '80%',
    height: 60,
    borderWidth: 1, marginBottom: 5, padding: 10,
  },
});
