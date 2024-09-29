import { StyleSheet, Text, View } from 'react-native';

import * as ExpoMicroIde from 'expo-micro-ide';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{ExpoMicroIde.hello()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
