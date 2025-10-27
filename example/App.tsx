import {
  ExpoMicroIde,
  type Files,
  type MicroDevice,
  type UsbDevice,
} from "expo-micro-ide";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [boardId, setBoardId] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Pronto para detectar dispositivo"
  );
  const [fileName, setFileName] = useState<string>("");
  const [renameTarget, setRenameTarget] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [files, setFiles] = useState<Files[]>([]);
  const [scriptContent, setScriptContent] = useState<string>(
    "print('Olá do ExpoMicroIde!')"
  );
  const [lastOutput, setLastOutput] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("disconnected");
  const [currentDevice, setCurrentDevice] = useState<MicroDevice | null>(null);
  const [usbDevices, setUsbDevices] = useState<UsbDevice[]>([]);

  useEffect(() => {
    // Inicializar o módulo
    ExpoMicroIde.initialize()
      .then(() => {
        setStatusMessage("Módulo inicializado");
      })
      .catch((error) => {
        // @ts-ignore
        setStatusMessage(`Erro ao inicializar: ${error?.message || error}`);
      });

    // Configurar listeners de eventos
    const statusListener = ExpoMicroIde.addStatusListener((event) => {
      setConnectionStatus(event.status);
      setStatusMessage(
        `Status: ${event.status}${event.message ? ` - ${event.message}` : ""}`
      );

      if (event.device) {
        setCurrentDevice(event.device);
        setBoardId(event.device.name);
      }

      if (event.devices) {
        setUsbDevices(event.devices);
      }
    });

    const dataListener = ExpoMicroIde.addDataListener((event) => {
      setLastOutput((prev) => prev + event.data);
    });

    const boardConnectListener = ExpoMicroIde.addBoardConnectListener(
      (event) => {
        setCurrentDevice(event.device);
        setBoardId(event.device.name);
        setStatusMessage(`Conectado a ${event.device.name}`);
        listFiles();
      }
    );

    const boardDisconnectListener = ExpoMicroIde.addBoardDisconnectListener(
      (event) => {
        setCurrentDevice(null);
        setBoardId("");
        setStatusMessage("Dispositivo desconectado");
        setFiles([]);
      }
    );

    const connectionErrorListener = ExpoMicroIde.addConnectionErrorListener(
      (event) => {
        setStatusMessage(`Erro: ${event.error} - ${event.message}`);
      }
    );

    const filesUpdateListener = ExpoMicroIde.addFilesUpdateListener((event) => {
      setFiles(event.files);
    });

    // Limpar listeners ao desmontar
    return () => {
      statusListener.remove();
      dataListener.remove();
      boardConnectListener.remove();
      boardDisconnectListener.remove();
      connectionErrorListener.remove();
      filesUpdateListener.remove();
    };
  }, []);

  async function withBusy<T>(action: () => Promise<T>): Promise<T> {
    setIsBusy(true);
    try {
      return await action();
    } finally {
      setIsBusy(false);
    }
  }

  async function detectDevices() {
    await withBusy(async () => {
      try {
        setStatusMessage("Detectando dispositivos USB...");
        const result = await ExpoMicroIde.detectUsbDevices();
        setStatusMessage(
          result ? "Dispositivos detectados" : "Nenhum dispositivo encontrado"
        );
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao detectar dispositivos: ${error?.message || error}`
        );
      }
    });
  }

  async function approveDevice(deviceId: string) {
    await withBusy(async () => {
      try {
        setStatusMessage(`Aprovando dispositivo ${deviceId}...`);
        const result = await ExpoMicroIde.approveDevice(deviceId);
        setStatusMessage(
          result ? "Dispositivo aprovado" : "Falha ao aprovar dispositivo"
        );
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao aprovar dispositivo: ${error?.message || error}`
        );
      }
    });
  }

  async function disconnectDevice() {
    await withBusy(async () => {
      try {
        setStatusMessage("Desconectando dispositivo...");
        const result = await ExpoMicroIde.disconnectDevice();
        setStatusMessage(
          result ? "Dispositivo desconectado" : "Falha ao desconectar"
        );
        if (result) {
          setCurrentDevice(null);
          setBoardId("");
          setFiles([]);
        }
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao desconectar: ${error?.message || error}`);
      }
    });
  }

  async function forgetDevice() {
    await withBusy(async () => {
      try {
        setStatusMessage("Esquecendo dispositivo...");
        const result = await ExpoMicroIde.forgetDevice();
        setStatusMessage(
          result ? "Dispositivo esquecido" : "Falha ao esquecer dispositivo"
        );
        if (result) {
          setCurrentDevice(null);
          setBoardId("");
          setFiles([]);
        }
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao esquecer dispositivo: ${error?.message || error}`
        );
      }
    });
  }

  async function getCurrentDevice() {
    await withBusy(async () => {
      try {
        const device = await ExpoMicroIde.getCurrentDevice();
        if (device) {
          setCurrentDevice(device);
          setBoardId(device.name);
          setStatusMessage(`Dispositivo atual: ${device.name}`);
        } else {
          setStatusMessage("Nenhum dispositivo conectado");
        }
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao obter dispositivo: ${error?.message || error}`
        );
      }
    });
  }

  async function listFiles() {
    await withBusy(async () => {
      try {
        const response = await ExpoMicroIde.listFiles();
        setFiles(response);
        setStatusMessage(`Arquivos listados: ${response.length}`);
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao listar arquivos: ${error?.message || error}`);
      }
    });
  }

  async function createFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para criar");
      return;
    }

    await withBusy(async () => {
      try {
        await ExpoMicroIde.createFile(fileName.trim());
        setStatusMessage(`Arquivo '${fileName.trim()}' criado`);
        await listFiles();
        clearFields();
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao criar arquivo: ${error?.message || error}`);
      }
    });
  }

  async function deleteFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para deletar");
      return;
    }

    await withBusy(async () => {
      try {
        await ExpoMicroIde.deleteFile(fileName.trim());
        setStatusMessage(`Arquivo '${fileName.trim()}' deletado`);
        await listFiles();
        clearFields();
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao deletar arquivo: ${error?.message || error}`);
      }
    });
  }

  async function renameFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o arquivo que deseja renomear");
      return;
    }

    if (!renameTarget.trim()) {
      setStatusMessage("Informe o novo nome do arquivo");
      return;
    }

    await withBusy(async () => {
      try {
        await ExpoMicroIde.renameFile(fileName.trim(), renameTarget.trim());
        setStatusMessage(
          `Arquivo '${fileName.trim()}' renomeado para '${renameTarget.trim()}'`
        );
        await listFiles();
        clearFields();
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao renomear arquivo: ${error?.message || error}`
        );
      }
    });
  }

  async function readFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para leitura");
      return;
    }

    await withBusy(async () => {
      try {
        const content = await ExpoMicroIde.readFile(fileName.trim());
        setFileContent(content);
        setRenameTarget(fileName.trim());
        setStatusMessage(`Arquivo '${fileName.trim()}' carregado`);
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao ler arquivo: ${error?.message || error}`);
      }
    });
  }

  async function writeFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para escrever");
      return;
    }

    await withBusy(async () => {
      try {
        await ExpoMicroIde.writeFile(fileName.trim(), fileContent);
        setStatusMessage(`Conteúdo salvo em '${fileName.trim()}'`);
        clearFields();
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao escrever arquivo: ${error?.message || error}`
        );
      }
    });
  }

  async function executeScript() {
    await withBusy(async () => {
      try {
        setLastOutput("");
        const output = await ExpoMicroIde.executeScript(scriptContent);
        setStatusMessage("Script executado com sucesso");
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao executar script: ${error?.message || error}`);
      }
    });
  }

  async function pauseScript() {
    await withBusy(async () => {
      try {
        const response = await ExpoMicroIde.pauseScript();
        setStatusMessage(`Script pausado: ${response}`);
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao pausar script: ${error?.message || error}`);
      }
    });
  }

  async function resetScript() {
    await withBusy(async () => {
      try {
        const response = await ExpoMicroIde.resetScript();
        setStatusMessage(`Script resetado: ${response}`);
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao resetar script: ${error?.message || error}`);
      }
    });
  }

  async function sendCommand() {
    if (!scriptContent.trim()) {
      setStatusMessage("Informe um comando para enviar");
      return;
    }

    await withBusy(async () => {
      try {
        const result = await ExpoMicroIde.sendCommand(scriptContent);
        setStatusMessage(
          result ? "Comando enviado" : "Falha ao enviar comando"
        );
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao enviar comando: ${error?.message || error}`);
      }
    });
  }

  async function sendCtrlC() {
    await withBusy(async () => {
      try {
        const result = await ExpoMicroIde.sendCtrlC();
        setStatusMessage(result ? "Ctrl+C enviado" : "Falha ao enviar Ctrl+C");
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao enviar Ctrl+C: ${error?.message || error}`);
      }
    });
  }

  async function sendCtrlD() {
    await withBusy(async () => {
      try {
        const result = await ExpoMicroIde.sendCtrlD();
        setStatusMessage(result ? "Ctrl+D enviado" : "Falha ao enviar Ctrl+D");
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao enviar Ctrl+D: ${error?.message || error}`);
      }
    });
  }

  async function resetBoard() {
    await withBusy(async () => {
      try {
        const result = await ExpoMicroIde.resetBoard();
        setLastOutput("");
        setStatusMessage(result ? "Board resetado" : "Falha ao resetar board");
      } catch (error) {
        // @ts-ignore
        setStatusMessage(`Erro ao resetar board: ${error?.message || error}`);
      }
    });
  }

  async function enterSilentMode() {
    await withBusy(async () => {
      try {
        const result = await ExpoMicroIde.enterSilentMode();
        setStatusMessage(
          result ? "Modo silencioso ativado" : "Falha ao ativar modo silencioso"
        );
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao ativar modo silencioso: ${error?.message || error}`
        );
      }
    });
  }

  async function sendCommandInSilentMode() {
    if (!scriptContent.trim()) {
      setStatusMessage("Informe um comando para enviar em modo silencioso");
      return;
    }

    await withBusy(async () => {
      try {
        const output =
          await ExpoMicroIde.sendCommandInSilentMode(scriptContent);
        setLastOutput(output);
        setStatusMessage("Comando executado em modo silencioso");
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao executar em modo silencioso: ${error?.message || error}`
        );
      }
    });
  }

  function clearFields() {
    setFileName("");
    setRenameTarget("");
    setFileContent("");
  }

  function clearOutput() {
    setLastOutput("");
    setStatusMessage("Output limpo");
  }

  const isConnected = connectionStatus === "connected";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {isBusy && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <Text style={styles.title}>ExpoMicroIde Demo</Text>
      <Text style={styles.subtitle}>
        Integração nativa entre React Native e placas microcontroladoras
      </Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status atual</Text>
        <Text style={styles.statusText}>{statusMessage}</Text>
        <Text style={styles.statusMeta}>Conexão: {connectionStatus}</Text>
        {currentDevice ? (
          <Text style={styles.statusMeta}>
            Conectado a: {currentDevice.name} ({currentDevice.port})
            {currentDevice.isMicroPython ? " - MicroPython" : ""}
          </Text>
        ) : (
          <Text style={styles.statusMeta}>Nenhum dispositivo conectado</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciamento de Dispositivos</Text>
        <View style={styles.buttonRow}>
          <Button title="Detectar dispositivos" onPress={detectDevices} />
          <Button title="Dispositivo atual" onPress={getCurrentDevice} />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Desconectar"
            onPress={disconnectDevice}
            disabled={!isConnected}
          />
          <Button
            title="Esquecer"
            onPress={forgetDevice}
            disabled={!isConnected}
          />
        </View>

        {usbDevices.length > 0 && (
          <View style={styles.deviceList}>
            <Text style={styles.subsectionTitle}>
              Dispositivos USB disponíveis:
            </Text>
            {usbDevices.map((device, index) => (
              <View key={index} style={styles.deviceItem}>
                <Text style={styles.deviceName}>
                  {device.deviceName || `Dispositivo ${index + 1}`}
                </Text>
                <Text style={styles.deviceDetails}>
                  VID: {device.vendorId}, PID: {device.productId}
                </Text>
                {device.manufacturerName && (
                  <Text style={styles.deviceDetails}>
                    Fabricante: {device.manufacturerName}
                  </Text>
                )}
                {device.productName && (
                  <Text style={styles.deviceDetails}>
                    Produto: {device.productName}
                  </Text>
                )}
                <Button
                  title="Aprovar"
                  onPress={() =>
                    approveDevice(`${device.vendorId}-${device.productId}`)
                  }
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciamento de Arquivos</Text>
        <TextInput
          placeholder="Nome do arquivo"
          value={fileName}
          onChangeText={setFileName}
          style={styles.input}
          editable={isConnected}
        />
        <TextInput
          placeholder="Conteúdo"
          value={fileContent}
          onChangeText={setFileContent}
          style={[styles.input, styles.textArea]}
          multiline
          editable={isConnected}
        />
        <View style={styles.buttonRow}>
          <Button
            title="Listar arquivos"
            onPress={listFiles}
            disabled={!isConnected}
          />
          <Button title="Limpar campos" onPress={clearFields} />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Criar arquivo"
            onPress={createFile}
            disabled={!isConnected}
          />
          <Button
            title="Deletar arquivo"
            onPress={deleteFile}
            disabled={!isConnected}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Ler arquivo"
            onPress={readFile}
            disabled={!isConnected}
          />
          <Button
            title="Escrever arquivo"
            onPress={writeFile}
            disabled={!isConnected}
          />
        </View>
        <TextInput
          placeholder="Novo nome (para renomear)"
          value={renameTarget}
          onChangeText={setRenameTarget}
          style={styles.input}
          editable={isConnected}
        />
        <Button
          title="Renomear arquivo"
          onPress={renameFile}
          disabled={!isConnected}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Execução de Scripts</Text>
        <TextInput
          placeholder="Script Python"
          value={scriptContent}
          onChangeText={setScriptContent}
          style={[styles.input, styles.textArea]}
          multiline
          editable={isConnected}
        />
        <View style={styles.buttonRow}>
          <Button
            title="Executar script"
            onPress={executeScript}
            disabled={!isConnected}
          />
          <Button
            title="Pausar script"
            onPress={pauseScript}
            disabled={!isConnected}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Resetar script"
            onPress={resetScript}
            disabled={!isConnected}
          />
          <Button title="Limpar output" onPress={clearOutput} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comandos REPL</Text>
        <View style={styles.buttonRow}>
          <Button
            title="Enviar comando"
            onPress={sendCommand}
            disabled={!isConnected}
          />
          <Button
            title="Modo silencioso"
            onPress={enterSilentMode}
            disabled={!isConnected}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Enviar em modo silencioso"
            onPress={sendCommandInSilentMode}
            disabled={!isConnected}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Enviar Ctrl+C"
            onPress={sendCtrlC}
            disabled={!isConnected}
          />
          <Button
            title="Enviar Ctrl+D"
            onPress={sendCtrlD}
            disabled={!isConnected}
          />
        </View>
        <Button
          title="Resetar board"
          onPress={resetBoard}
          disabled={!isConnected}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Output</Text>
        <View style={styles.outputCard}>
          <Text style={styles.outputText}>
            {lastOutput ? lastOutput : "Nenhum output disponível"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Arquivos no dispositivo</Text>
        <FlatList
          data={files}
          keyExtractor={(item) => item.name}
          style={styles.fileList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.fileItem}
              onPress={() => {
                setFileName(item.name);
                setRenameTarget(item.name);
              }}
            >
              <Text style={styles.fileName}>{item.name}</Text>
              <Text style={styles.fileDetails}>
                {item.size} bytes —{item.type === 0 ? " Arquivo" : " Pasta"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.fileDetails}>Nenhum arquivo disponível</Text>
          }
        />
      </View>

      <View style={styles.footerSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#64748B",
    marginBottom: 6,
  },
  statusText: {
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 4,
  },
  statusMeta: {
    fontSize: 12,
    color: "#475569",
  },
  section: {
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    color: "#000",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  outputCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 100,
    maxHeight: 300,
  },
  outputText: {
    fontSize: 13,
    color: "#1E293B",
    fontFamily: "monospace",
  },
  fileList: {
    maxHeight: 280,
  },
  fileItem: {
    paddingVertical: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0F172A",
  },
  fileDetails: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.75)",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  footerSpacer: {
    height: 40,
  },
  deviceList: {
    marginTop: 12,
  },
  deviceItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0F172A",
  },
  deviceDetails: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 8,
  },
});
