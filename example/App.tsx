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
  Platform,
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
    sendDiscordWebhook(urlDiscordWebhook, "🚀 Iniciando App - useEffect");

    ExpoMicroIde.initialize()
      .then(() => {
        setStatusMessage("Módulo inicializado");
        sendDiscordWebhook(urlDiscordWebhook, "✅ Módulo inicializado com sucesso");
      })
      .catch((error) => {
        // @ts-ignore
        const errorMsg = `Erro ao inicializar: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg}`);
      });

    const statusListener = ExpoMicroIde.addStatusListener((event) => {
      setConnectionStatus(event.status);
      setStatusMessage(
        `Status: ${event.status}${event.message ? ` - ${event.message}` : ""}`,
      );
      sendDiscordWebhook(urlDiscordWebhook, `📊 Status atualizado: ${JSON.stringify(event)}`);

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
      sendDiscordWebhook(urlDiscordWebhook, `📥 Dados recebidos: ${event.data.substring(0, 100)}...`);
    });

    const boardConnectListener = ExpoMicroIde.addBoardConnectListener(
      (event) => {
        setCurrentDevice(event.device);
        setBoardId(event.device.name);
        setStatusMessage(`Conectado a ${event.device.name}`);
        sendDiscordWebhook(urlDiscordWebhook, `🔌 Board conectado: ${JSON.stringify(event.device)}`);
        listFiles();
      },
    );

    const boardDisconnectListener = ExpoMicroIde.addBoardDisconnectListener(
      (event) => {
        setCurrentDevice(null);
        setBoardId("");
        setStatusMessage("Dispositivo desconectado");
        setFiles([]);
        sendDiscordWebhook(urlDiscordWebhook, `🔌 Board desconectado: ${JSON.stringify(event)}`);
      },
    );

    const connectionErrorListener = ExpoMicroIde.addConnectionErrorListener(
      (event) => {
        setStatusMessage(`Erro: ${event.error} - ${event.message}`);
        sendDiscordWebhook(urlDiscordWebhook, `❌ Erro de conexão: ${JSON.stringify(event)}`);
      },
    );

    const filesUpdateListener = ExpoMicroIde.addFilesUpdateListener((event) => {
      setFiles(event.files);
      sendDiscordWebhook(urlDiscordWebhook, `📁 Arquivos atualizados: ${event.files.length} arquivos`);
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
    // Monta informações do dispositivo microcontrolador
    const deviceInfo = currentDevice
      ? {
        nome: currentDevice.name,
        porta: currentDevice.port,
        isMicroPython: currentDevice.isMicroPython,
        vendorId: currentDevice.vendorId,
        productId: currentDevice.productId,
      }
      : null;

    // Monta informações da plataforma Android/iOS
    const platformInfo = {
      OS: Platform.OS,
      version: Platform.Version,
      ...(Platform.OS === "android" && {
        androidApiLevel: Platform.Version,
      }),
      ...(Platform.OS === "ios" && {
        isPad: Platform.isPad,
        isTV: Platform.isTV,
      }),
    };

    const enrichedMessage = [
      `**${message}**`,
      "",
      `📱 **Plataforma:**\n\`\`\`json\n${JSON.stringify(platformInfo, null, 2)}\n\`\`\``,
      "",
      deviceInfo
        ? `🔌 **Dispositivo:**\n\`\`\`json\n${JSON.stringify(deviceInfo, null, 2)}\n\`\`\``
        : "⚠️ Nenhum dispositivo conectado",
      "",
      `⏰ ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");

    const payload = { content: enrichedMessage };

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
        sendDiscordWebhook(urlDiscordWebhook, "🔍 Iniciando detecção de dispositivos USB");

        const result = await ExpoMicroIde.detectUsbDevices();
        const msg = result ? "Dispositivos detectados" : "Nenhum dispositivo encontrado";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg} - Result: ${result}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao detectar dispositivos: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function approveDevice(deviceId: string) {
    await withBusy(async () => {
      try {
        setStatusMessage(`Aprovando dispositivo ${deviceId}...`);
        sendDiscordWebhook(urlDiscordWebhook, `🔐 Aprovando dispositivo: ${deviceId}`);

        const result = await ExpoMicroIde.approveDevice(deviceId);
        const msg = result ? "Dispositivo aprovado" : "Falha ao aprovar dispositivo";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg} - DeviceId: ${deviceId}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao aprovar dispositivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function disconnectDevice() {
    await withBusy(async () => {
      try {
        setStatusMessage("Desconectando dispositivo...");
        sendDiscordWebhook(urlDiscordWebhook, "🔌 Desconectando dispositivo");

        const result = await ExpoMicroIde.disconnectDevice();
        const msg = result ? "Dispositivo desconectado" : "Falha ao desconectar";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);

        if (result) {
          setCurrentDevice(null);
          setBoardId("");
          setFiles([]);
        }
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao desconectar: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function forgetDevice() {
    await withBusy(async () => {
      try {
        setStatusMessage("Esquecendo dispositivo...");
        sendDiscordWebhook(urlDiscordWebhook, "🧹 Esquecendo dispositivo");

        const result = await ExpoMicroIde.forgetDevice();
        const msg = result ? "Dispositivo esquecido" : "Falha ao esquecer dispositivo";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);

        if (result) {
          setCurrentDevice(null);
          setBoardId("");
          setFiles([]);
        }
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao esquecer dispositivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function getCurrentDevice() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "📱 Obtendo dispositivo atual");

        const device = await ExpoMicroIde.getCurrentDevice();
        if (device) {
          setCurrentDevice(device);
          setBoardId(device.name);
          setStatusMessage(`Dispositivo atual: ${device.name}`);
          sendDiscordWebhook(urlDiscordWebhook, `✅ Dispositivo atual: ${JSON.stringify(device)}`);
        } else {
          setStatusMessage("Nenhum dispositivo conectado");
          sendDiscordWebhook(urlDiscordWebhook, "⚠️ Nenhum dispositivo conectado");
        }
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao obter dispositivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function listFiles() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "📂 Listando arquivos");

        const response = await ExpoMicroIde.listFiles();
        console.log(response);
        // @ts-ignore
        setFiles(JSON.parse(response));
        setStatusMessage(`Arquivos listados: ${response.length}`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Arquivos listados: ${response}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao listar arquivos: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function createFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para criar");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de criar arquivo sem nome");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `📝 Criando arquivo: ${fileName.trim()}`);

        await ExpoMicroIde.createFile(fileName.trim());
        setStatusMessage(`Arquivo '${fileName.trim()}' criado`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Arquivo '${fileName.trim()}' criado com sucesso`);

        await listFiles();
        clearFields();
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao criar arquivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - Arquivo: ${fileName} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function deleteFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para deletar");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de deletar arquivo sem nome");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `🗑️ Deletando arquivo: ${fileName.trim()}`);

        await ExpoMicroIde.deleteFile(fileName.trim());
        setStatusMessage(`Arquivo '${fileName.trim()}' deletado`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Arquivo '${fileName.trim()}' deletado com sucesso`);

        await listFiles();
        clearFields();
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao deletar arquivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - Arquivo: ${fileName} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function renameFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o arquivo que deseja renomear");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de renomear arquivo sem nome original");
      return;
    }

    if (!renameTarget.trim()) {
      setStatusMessage("Informe o novo nome do arquivo");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de renomear arquivo sem novo nome");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `✏️ Renomeando: ${fileName.trim()} → ${renameTarget.trim()}`);

        await ExpoMicroIde.renameFile(fileName.trim(), renameTarget.trim());
        setStatusMessage(
          `Arquivo '${fileName.trim()}' renomeado para '${renameTarget.trim()}'`,
        );
        sendDiscordWebhook(urlDiscordWebhook, `✅ Arquivo renomeado: ${fileName.trim()} → ${renameTarget.trim()}`);

        await listFiles();
        clearFields();
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao renomear arquivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - De: ${fileName} Para: ${renameTarget} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function readFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para leitura");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de ler arquivo sem nome");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `📖 Lendo arquivo: ${fileName.trim()}`);

        const content = await ExpoMicroIde.readFile(fileName.trim());
        setFileContent(content);
        setScriptContent(content);
        setRenameTarget(fileName.trim());
        setStatusMessage(`Arquivo '${fileName.trim()}' carregado`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Arquivo lido: ${fileName.trim()} - Tamanho: ${content.length} chars`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao ler arquivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - Arquivo: ${fileName} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function writeFile() {
    if (!fileName.trim()) {
      setStatusMessage("Informe o nome do arquivo para escrever");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de escrever arquivo sem nome");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `💾 Escrevendo arquivo: ${fileName.trim()} - Tamanho: ${fileContent.length} chars`);

        await ExpoMicroIde.writeFile(fileName.trim(), fileContent);
        setStatusMessage(`Conteúdo salvo em '${fileName.trim()}'`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Arquivo escrito: ${fileName.trim()}`);

        clearFields();
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao escrever arquivo: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - Arquivo: ${fileName} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function executeScript() {
    await withBusy(async () => {
      try {
        setLastOutput("");
        sendDiscordWebhook(urlDiscordWebhook, `▶️ Executando script: ${scriptContent.substring(0, 100)}...`);

        const output = await ExpoMicroIde.executeScript(scriptContent);
        setStatusMessage("Script executado com sucesso");
        sendDiscordWebhook(urlDiscordWebhook, `✅ Script executado com sucesso`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao executar script: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function pauseScript() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "⏸️ Pausando script");

        const response = await ExpoMicroIde.pauseScript();
        setStatusMessage(`Script pausado: ${response}`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Script pausado: ${response}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao pausar script: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function resetScript() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "🔄 Resetando script");

        const response = await ExpoMicroIde.resetScript();
        setStatusMessage(`Script resetado: ${response}`);
        sendDiscordWebhook(urlDiscordWebhook, `✅ Script resetado: ${response}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao resetar script: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function sendCommand() {
    if (!scriptContent.trim()) {
      setStatusMessage("Informe um comando para enviar");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de enviar comando vazio");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `📤 Enviando comando: ${scriptContent.substring(0, 100)}...`);

        const result = await ExpoMicroIde.sendCommand(scriptContent);
        const msg = result ? "Comando enviado" : "Falha ao enviar comando";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao enviar comando: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function sendCtrlC() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "⌨️ Enviando Ctrl+C");

        const result = await ExpoMicroIde.sendCtrlC();
        const msg = result ? "Ctrl+C enviado" : "Falha ao enviar Ctrl+C";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao enviar Ctrl+C: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function sendCtrlD() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "⌨️ Enviando Ctrl+D");

        const result = await ExpoMicroIde.sendCtrlD();
        const msg = result ? "Ctrl+D enviado" : "Falha ao enviar Ctrl+D";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao enviar Ctrl+D: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function resetBoard() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "🔄 Resetando board");

        const result = await ExpoMicroIde.resetBoard();
        setLastOutput("");
        const msg = result ? "Board resetado" : "Falha ao resetar board";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao resetar board: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function enterSilentMode() {
    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, "🔇 Entrando em modo silencioso");

        const result = await ExpoMicroIde.enterSilentMode();
        const msg = result
          ? "Modo silencioso ativado"
          : "Falha ao ativar modo silencioso";
        setStatusMessage(msg);
        sendDiscordWebhook(urlDiscordWebhook, `✅ ${msg}`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao ativar modo silencioso: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  async function sendCommandInSilentMode() {
    if (!scriptContent.trim()) {
      setStatusMessage("Informe um comando para enviar em modo silencioso");
      sendDiscordWebhook(urlDiscordWebhook, "⚠️ Tentativa de enviar comando vazio em modo silencioso");
      return;
    }

    await withBusy(async () => {
      try {
        sendDiscordWebhook(urlDiscordWebhook, `🔇 Enviando comando em modo silencioso: ${scriptContent.substring(0, 100)}...`);

        const output =
          await ExpoMicroIde.sendCommandInSilentMode(scriptContent);
        setLastOutput(output);
        setStatusMessage("Comando executado em modo silencioso");
        sendDiscordWebhook(urlDiscordWebhook, `✅ Comando executado em modo silencioso - Output: ${output.substring(0, 100)}...`);
      } catch (error) {
        // @ts-ignore
        const errorMsg = `Erro ao executar em modo silencioso: ${error?.message || error}`;
        setStatusMessage(errorMsg);
        sendDiscordWebhook(urlDiscordWebhook, `❌ ${errorMsg} - ${JSON.stringify(error)}`);
      }
    });
  }

  function clearFields() {
    setFileName("");
    setRenameTarget("");
    setFileContent("");
    sendDiscordWebhook(urlDiscordWebhook, "🧹 Campos limpos");
  }

  function clearOutput() {
    setLastOutput("");
    setStatusMessage("Output limpo");
    sendDiscordWebhook(urlDiscordWebhook, "🧹 Output limpo");
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
