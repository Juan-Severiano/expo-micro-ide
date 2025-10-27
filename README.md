# Expo Micro IDE

Um ambiente de desenvolvimento integrado para microcontroladores, permitindo programar e interagir com dispositivos MicroPython e CircuitPython diretamente do seu smartphone Android usando React Native e Expo.

## Características

- ✅ Conexão USB Serial com microcontroladores
- ✅ Suporte para MicroPython e CircuitPython
- ✅ Terminal REPL interativo
- ✅ Editor de código integrado
- ✅ Gerenciamento de arquivos no dispositivo
- ✅ Execução de scripts

## Instalação

```bash
npm install expo-micro-ide
```

## Uso Básico

```javascript
import { ExpoMicroIdeModule } from 'expo-micro-ide';

// Detectar dispositivos USB
ExpoMicroIdeModule.detectUsbDevices();

// Enviar comando para o dispositivo
ExpoMicroIdeModule.sendCommand('print("Hello, World!")');

// Receber dados do dispositivo
ExpoMicroIdeModule.addListener('onReceiveData', (data) => {
  console.log('Dados recebidos:', data);
});

// Monitorar status de conexão
ExpoMicroIdeModule.addListener('onStatusChanges', (status) => {
  console.log('Status da conexão:', status);
});

// Monitorar eventos de conexão
ExpoMicroIdeModule.addListener('onBoardConnect', (device) => {
  console.log('Dispositivo conectado:', device);
});

// Monitorar eventos de desconexão
ExpoMicroIdeModule.addListener('onBoardDisconnect', (device) => {
  console.log('Dispositivo desconectado:', device);
});
```

## Configuração do Android

Adicione as seguintes permissões ao seu arquivo `AndroidManifest.xml`:

```xml
<uses-feature android:name="android.hardware.usb.host" />
<uses-permission android:name="android.permission.USB_PERMISSION" />
```

Adicione o filtro de intenção para detectar dispositivos USB:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
    </intent-filter>
    <meta-data
        android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
        android:resource="@xml/device_filter" />
</activity>
```

Crie um arquivo `device_filter.xml` em `res/xml/` com o seguinte conteúdo:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- MicroPython devices -->
    <usb-device vendor-id="11914" /> <!-- 0x2E8A Raspberry Pi Pico -->
    <!-- Add other devices as needed -->
</resources>
```

## Documentação

Para mais informações, consulte a documentação completa:

- [Primeiros Passos](./docs/getting-started.md)
- [Referência da API](./docs/api-reference.md)
- [BoardManager](./docs/board-manager.md)

## Exemplo

Veja o [aplicativo de exemplo](./example/) para uma implementação completa.

## Requisitos

- Dispositivo Android com suporte a USB OTG (On-The-Go)
- Microcontrolador compatível com MicroPython ou CircuitPython
- Cabo USB compatível

## Licença

MIT