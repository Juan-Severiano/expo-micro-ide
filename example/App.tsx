import * as ExpoMicroIde from "expo-micro-ide";
import { Button, StyleSheet, Text, View } from "react-native";

export default function App() {
  async function connect() {
    try {
      console.log("Clicou");
      const res = await ExpoMicroIde.connectUSB();
      console.log(res);
      console.log("Executou");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text>{ExpoMicroIde.hello()}</Text>
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
