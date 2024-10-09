import * as ExpoMicroIde from "expo-micro-ide";
import React, { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function App() {
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState([]);

  async function connect() {
    try {
      console.log("Clicou em detectar dispositivos");
      const res = await ExpoMicroIde.initialize();
      console.log(res);
      if (res.length > 0) {
        // await ExpoMicroIde.connectToUsbDevice(res[0].deviceName);
        setStatus("Conectado a " + res[0].deviceName);
      } else {
        setStatus("Nenhum dispositivo encontrado");
      }
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setStatus("Erro ao conectar: " + error?.message);
    }
  }
  async function list() {
    try {
      console.log("Clicou em detectar dispositivos");
      const res = await ExpoMicroIde.listFiles();
      console.log(res);
      if (res.length > 0) {
      } else {
        setStatus("Nenhum dispositivo encontrado");
      }
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setStatus("Erro ao conectar: " + error?.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Status: {status}</Text>
      <Button title="Detectar Dispositivos" onPress={connect} />
      <View>
      <Button title="LIST" onPress={list} />
      </View>
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
});
