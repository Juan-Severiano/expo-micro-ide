# API Reference

## Módulos Nativos

### ExpoMicroIdeModule

O módulo principal que expõe as funcionalidades nativas para o JavaScript.

#### Métodos

| Método | Descrição | Parâmetros | Retorno |
|--------|-----------|------------|---------|
| `detectUsbDevices()` | Detecta dispositivos USB conectados | - | `Promise<void>` |
| `sendCommand(command)` | Envia um comando para o dispositivo | `command: string` | `Promise<void>` |
| `sendCommandSilent(command)` | Envia um comando em modo silencioso | `command: string` | `Promise<string>` |
| `approveDevice(deviceId)` | Aprova a conexão com um dispositivo específico | `deviceId: number` | `Promise<void>` |
| `denyDevice()` | Nega a conexão com o dispositivo atual | - | `Promise<void>` |
| `disconnectDevice()` | Desconecta o dispositivo atual | - | `Promise<void>` |
| `forgetDevice(deviceId)` | Remove um dispositivo da lista de dispositivos conhecidos | `deviceId: number` | `Promise<void>` |

#### Eventos

| Evento | Descrição | Dados |
|--------|-----------|-------|
| `onStatusChanges` | Notifica sobre mudanças no status da conexão | `{ status: string, device?: UsbDevice, error?: string, message?: string }` |
| `onReceiveData` | Notifica quando novos dados são recebidos | `{ data: string }` |
| `onBoardConnect` | Notifica quando um dispositivo é conectado | `{ device: UsbDevice }` |
| `onBoardDisconnect` | Notifica quando um dispositivo é desconectado | `{ device?: UsbDevice }` |
| `onConnectionError` | Notifica quando ocorre um erro de conexão | `{ error: string, message: string }` |

## Gerenciadores

### BoardManager

Gerencia a conexão USB Serial com dispositivos MicroPython e CircuitPython.

#### Construtor

```kotlin
BoardManager(
  context: Activity,
  onStatusChanges: ((status: ConnectionStatus) -> Unit)? = null,
  onReceiveData: ((data: String) -> Unit)? = null,
  onBoardConnect: ((device: UsbDevice) -> Unit)? = null,
  onBoardDisconnect: ((device: UsbDevice?) -> Unit)? = null,
  onConnectionError: ((error: ConnectionError, message: String) -> Unit)? = null
)
```

#### Métodos

| Método | Descrição | Parâmetros | Retorno |
|--------|-----------|------------|---------|
| `detectUsbDevices()` | Detecta dispositivos USB conectados | - | `void` |
| `write(code, onWrite)` | Escreve código Python no REPL | `code: String, onWrite: (() -> Unit)?` | `void` |
| `writeCommand(code, onWrite)` | Escreve comandos REPL que não requerem eco | `code: String, onWrite: (() -> Unit)?` | `void` |
| `writeInSilentMode(code, onResponse)` | Escreve código em modo silencioso | `code: String, onResponse: ((data: String) -> Unit)?` | `void` |
| `onDenyDevice()` | Nega a conexão com o dispositivo atual | - | `void` |
| `onDisconnectDevice()` | Desconecta o dispositivo atual | - | `void` |
| `onForgetDevice(device)` | Remove um dispositivo da lista de dispositivos conhecidos | `device: UsbDevice` | `void` |

### CommandsManager

Gerencia comandos para interagir com o REPL do MicroPython.

#### Constantes

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `CTRL_A` | `"\u0001"` | Entra no modo de edição de linha |
| `CTRL_B` | `"\u0002"` | Envia break (interrompe a execução) |
| `CTRL_C` | `"\u0003"` | Interrompe o programa atual |
| `CTRL_D` | `"\u0004"` | Reinicia o REPL |
| `CTRL_E` | `"\u0005"` | Entra no modo de edição de bloco |
| `SILENT_MODE` | `"\u0001\u0004"` | Entra no modo silencioso (CTRL_A + CTRL_D) |
| `RESET` | `"\u0004"` | Reinicia o REPL (CTRL_D) |

## Utilitários

### ConnectionStatus

Classe sealed que representa os diferentes estados de conexão.

| Estado | Descrição | Propriedades |
|--------|-----------|-------------|
| `Connecting` | Conectando ao dispositivo | - |
| `Connected` | Conectado ao dispositivo | `device: UsbDevice` |
| `Approve` | Solicitação de aprovação de dispositivo | `usbDevices: List<UsbDevice>` |
| `Error` | Erro de conexão | `error: String, msg: String` |

### ConnectionError

Enum que representa os diferentes tipos de erros de conexão.

| Erro | Descrição |
|------|-----------|
| `NO_DEVICES` | Nenhum dispositivo USB conectado |
| `PERMISSION_DENIED` | Permissão USB negada |
| `NO_DRIVER_FOUND` | Nenhum driver encontrado para o dispositivo |
| `NO_PORT_FOUND` | Nenhuma porta serial encontrada |
| `CANT_OPEN_CONNECTION` | Não foi possível abrir a conexão com o dispositivo |
| `CANT_OPEN_PORT` | Não foi possível abrir a porta serial |
| `CONNECTION_LOST` | Conexão perdida com o dispositivo |
| `NOT_SUPPORTED` | Dispositivo não suportado |
| `UNEXPECTED_ERROR` | Erro inesperado |

### ExecutionMode

Enum que representa os diferentes modos de execução.

| Modo | Descrição |
|------|-----------|
| `INTERACTIVE` | Modo interativo (REPL) |
| `SCRIPT` | Modo de execução de script |