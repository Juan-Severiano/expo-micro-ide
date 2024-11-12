import * as ExpoMicroIde from "expo-micro-ide";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function App() {
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<ExpoMicroIde.Files[]>([]);

  async function connect() {
    try {
      console.log("Clicou em detectar dispositivos");
      const res = await ExpoMicroIde.initialize();
      console.log(res)
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
      const res = await ExpoMicroIde.files.list();
      console.log(res);
      if (res.length > 0) {
        setStatus("Your files")
        setFiles(res)
      } else {
        setStatus("Nenhum arquivo encontrado" + res);
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
    await ExpoMicroIde.files.create(fileName)
    await list()
    setStatus(`Arquivo '${fileName}' criado`);
  }

  async function deleteFile() {
    // setFiles(prevFiles => {
    //   const updatedFiles = { ...prevFiles };
    //   if (fileName in updatedFiles) {
    //     delete updatedFiles[fileName];
    //     setStatus(`Arquivo '${fileName}' deletado`);
    //   } else {
    //     setStatus("Arquivo não encontrado");
    //   }
    //   return updatedFiles;
    // });
    await ExpoMicroIde.files.remove("asd.py")
    await list()
  }

  async function renameFile(newName: string) {
    // setFiles(prevFiles => {
    //   const updatedFiles = { ...prevFiles };
    //   if (fileName in updatedFiles) {
    //     updatedFiles[newName] = updatedFiles[fileName];
    //     delete updatedFiles[fileName];
    //     setStatus(`Arquivo '${fileName}' renomeado para '${newName}'`);
    //   } else {
    //     setStatus("Arquivo não encontrado");
    //   }
    //   return updatedFiles;
    // });
    await ExpoMicroIde.files.rename("q.py", "juan.py")
    await list()
  }

  async function readFile() {
    if (!fileName) {
      setStatus("Nome do arquivo é necessário para leitura");
      return;
    }
    // const fileContent = files[fileName];
    // if (fileContent !== undefined) {
    //   setContent(fileContent);
    //   setStatus(`Conteúdo do arquivo '${fileName}': ${fileContent}`);
    // } else {
    //   setStatus("Arquivo não encontrado");
    // }
    const cont = await ExpoMicroIde.files.read(`/${fileName}`)
    if (typeof cont === "string") {
      setContent(cont)
    }
  }

  async function writeFile() {
    if (!fileName) {
      setStatus("Nome do arquivo é necessário para escrita");
      return;
    }
    try {
      ExpoMicroIde.files.write(`/${fileName}`, "print('hello world')")
    } catch(err) {
      
    }
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
      {
        files.length > 0 && (
          files.map(file => (
            <Text>{file.name}</Text>
          ))
        )
      }
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
