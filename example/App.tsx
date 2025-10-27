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
    "Pronto para detectar dispositivo",
  );
  const [fileName, setFileName] = useState<string>("");
  const [renameTarget, setRenameTarget] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [files, setFiles] = useState<Files[]>([]);
  const [scriptContent, setScriptContent] = useState<string>(
    "print('Olá do ExpoMicroIde!')",
  );
  const [lastOutput, setLastOutput] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("disconnected");
  const [currentDevice, setCurrentDevice] = useState<MicroDevice | null>(null);
  const [usbDevices, setUsbDevices] = useState<UsbDevice[]>([]);
  const urlDiscordWebhook =
    "https://discord.com/api/webhooks/1432407766542057614/yiRofiCVCarLFFviWrpjqzX8gcQn9b0o-u0S4D-TShsrqLluPZPYBn1hTreFL3k4VhhT";

  useEffect(() => {
    setStatusMessage("Inicializando módulo...");
    ExpoMicroIde.initialize()
      .then(() => {
        setStatusMessage("Módulo inicializado");
      })
      .catch((error) => {
        // @ts-ignore
        setStatusMessage(`Erro ao inicializar: ${error?.message || error}`);
      });

    const statusListener = ExpoMicroIde.addStatusListener((event) => {
      setConnectionStatus(event.status);
      setStatusMessage(
        `Status: ${event.status}${event.message ? ` - ${event.message}` : ""}`,
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
      },
    );

    const boardDisconnectListener = ExpoMicroIde.addBoardDisconnectListener(
      (event) => {
        setCurrentDevice(null);
        setBoardId("");
        setStatusMessage("Dispositivo desconectado");
        setFiles([]);
      },
    );

    const connectionErrorListener = ExpoMicroIde.addConnectionErrorListener(
      (event) => {
        setStatusMessage(`Erro: ${event.error} - ${event.message}`);
      },
    );

    const filesUpdateListener = ExpoMicroIde.addFilesUpdateListener((event) => {
      setFiles(event.files);
    });

    return () => {
      statusListener.remove();
      dataListener.remove();
      boardConnectListener.remove();
      boardDisconnectListener.remove();
      connectionErrorListener.remove();
      filesUpdateListener.remove();
    };
  }, []);

  async function sendDiscordWebhook(
    webhookUrl: string,
    message: string,
  ): Promise<void> {
    const payload = { content: message };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Erro ao enviar webhook: ${errorText}`);
      }
    } catch (error) {
      console.warn("Erro na requisição do webhook:", error);
    }
  }

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
          result ? "Dispositivos detectados" : "Nenhum dispositivo encontrado",
        );
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao detectar dispositivos: ${error?.message || error}`,
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
          result ? "Dispositivo aprovado" : "Falha ao aprovar dispositivo",
        );
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao aprovar dispositivo: ${error?.message || error}`,
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
          result ? "Dispositivo desconectado" : "Falha ao desconectar",
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
          result ? "Dispositivo esquecido" : "Falha ao esquecer dispositivo",
        );
        if (result) {
          setCurrentDevice(null);
          setBoardId("");
          setFiles([]);
        }
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao esquecer dispositivo: ${error?.message || error}`,
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
          `Erro ao obter dispositivo: ${error?.message || error}`,
        );
      }
    });
  }

  async function listFiles() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "Hello, World!");
        const response = await ExpoMicroIde.listFiles();
        console.log(response);
        // @ts-ignore
        setFiles(JSON.parse(response));
        setStatusMessage(`Arquivos listados: ${response.length}`);
      } catch (error) {
        // @ts-ignore
        sendDiscordWebhook(urlDiscordWebhook, `Erro ao listar arquivos: ${error?.message || error}`);
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
          `Arquivo '${fileName.trim()}' renomeado para '${renameTarget.trim()}'`,
        );
        await listFiles();
        clearFields();
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao renomear arquivo: ${error?.message || error}`,
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
        setScriptContent(content);
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
          `Erro ao escrever arquivo: ${error?.message || error}`,
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
          result ? "Comando enviado" : "Falha ao enviar comando",
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
          result
            ? "Modo silencioso ativado"
            : "Falha ao ativar modo silencioso",
        );
      } catch (error) {
        setStatusMessage(
          // @ts-ignore
          `Erro ao ativar modo silencioso: ${error?.message || error}`,
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
          `Erro ao executar em modo silencioso: ${error?.message || error}`,
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
    <View style={styles.container}>
      <ScrollView
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
            <Button title="Desconectar" onPress={disconnectDevice} />
            <Button title="Esquecer" onPress={forgetDevice} />
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
            <Button title="Listar arquivos" onPress={listFiles} />
            <Button title="Executar arquivo" onPress={() => executeScript()} />
            <Button title="Limpar campos" onPress={clearFields} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Criar arquivo" onPress={createFile} />
            <Button title="Deletar arquivo" onPress={deleteFile} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Ler arquivo" onPress={readFile} />
            <Button title="Escrever arquivo" onPress={writeFile} />
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
            <Button title="Executar script" onPress={executeScript} />
            <Button title="Pausar script" onPress={pauseScript} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Resetar script" onPress={resetScript} />
            <Button title="Limpar output" onPress={clearOutput} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comandos REPL</Text>
          <View style={styles.buttonRow}>
            <Button title="Enviar comando" onPress={sendCommand} />
            <Button title="Modo silencioso" onPress={enterSilentMode} />
          </View>
          <View style={styles.buttonRow}>
            <Button
              title="Enviar em modo silencioso"
              onPress={sendCommandInSilentMode}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Enviar Ctrl+C" onPress={sendCtrlC} />
            <Button title="Enviar Ctrl+D" onPress={sendCtrlD} />
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
          <View style={styles.fileListContainer}>
            {files.length > 0 ? (
              files?.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.fileItem}
                  onPress={() => {
                    setFileName(item.name);
                    setRenameTarget(item.name);
                    readFile();
                  }}
                >
                  <Text style={styles.fileName}>{item.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyListText}>
                Nenhum arquivo encontrado
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 8,
  },
  statusContainer: {
    backgroundColor: "#e8f4fd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusMeta: {
    fontSize: 12,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  outputCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
  },
  outputText: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  deviceList: {
    marginTop: 16,
  },
  deviceItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  fileListContainer: {
    minHeight: 100,
    maxHeight: 300,
  },
  fileList: {
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    padding: 8,
  },
  fileItem: {
    padding: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  fileType: {
    fontSize: 12,
    color: "#666",
  },
  fileSize: {
    fontSize: 12,
    color: "#999",
  },
  emptyListText: {
    padding: 16,
    textAlign: "center",
    color: "#999",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  footerSpacer: {
    height: 40,
  },
});
