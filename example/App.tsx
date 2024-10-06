import * as ExpoMicroIde from "expo-micro-ide";
import { Button, StyleSheet, Text, View } from "react-native";

export default function App() {
  const status = ExpoMicroIde.useStatus();

  async function connect() {
    try {
      console.log("Clicou");
      const res = await ExpoMicroIde.detectUsbDevices();
      console.log(res);
      console.log("Executou");
    } catch (error) {
      console.log(error);
    }
  }

  async function getFilesAndDirs() {
    try {
      console.log("Clicou");
      const res = await ExpoMicroIde.showFilesAndDirs();
      console.log(res);
      console.log("Executou");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text>{`${status}`}</Text>
      <Text>{ExpoMicroIde.hello()}</Text>
      {
        (
          <Button title="Show Files" onPress={getFilesAndDirs} />
        )
      }
      <Button title="Click me" onPress={connect} />
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
