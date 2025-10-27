# Primeiros Passos com Expo Micro IDE

## Introdução

O Expo Micro IDE é um ambiente de desenvolvimento integrado para microcontroladores, que permite programar e interagir com dispositivos MicroPython e CircuitPython diretamente do seu smartphone Android usando React Native e Expo.

## Requisitos

- Dispositivo Android com suporte a USB OTG (On-The-Go)
- Microcontrolador compatível com MicroPython ou CircuitPython
- Cabo USB compatível

## Instalação

### Para Usuários

1. Instale o aplicativo Expo Go da Play Store
2. Escaneie o QR code do projeto ou acesse o link fornecido
3. Conecte seu microcontrolador ao dispositivo Android usando um cabo USB

### Para Desenvolvedores

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/expo-micro-ide.git
   cd expo-micro-ide
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o projeto:
   ```bash
   npx expo start
   ```

4. Escaneie o QR code com o aplicativo Expo Go ou execute em um emulador/dispositivo conectado

## Estrutura do Projeto

O projeto segue a estrutura padrão de um módulo Expo, com algumas adições específicas:

```
expo-micro-ide/
├── android/              # Código nativo Android
│   └── src/main/java/expo/modules/microide/
│       ├── managers/     # Gerenciadores de funcionalidades
│       └── utils/        # Utilitários e classes auxiliares
├── ios/                  # Código nativo iOS
├── src/                  # Código JavaScript/TypeScript
│   ├── domain/           # Modelos e interfaces
│   └── ...
├── example/              # Aplicativo de exemplo
└── docs/                 # Documentação
```

## Primeiros Passos

### Conectando a um Dispositivo

1. Conecte seu microcontrolador ao dispositivo Android
2. O aplicativo detectará automaticamente dispositivos compatíveis
3. Se solicitado, conceda permissão para acessar o dispositivo USB
4. Uma vez conectado, você verá o terminal REPL do MicroPython

### Executando Comandos

```javascript
// No código JavaScript/TypeScript
import { ExpoMicroIdeModule } from 'expo-micro-ide';

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
```

## Próximos Passos

- Explore a [documentação da API](./api-reference.md) para mais detalhes sobre as funcionalidades disponíveis
- Veja o [guia do BoardManager](./board-manager.md) para entender como gerenciar conexões com dispositivos
- Confira os [exemplos](../example/) para ver implementações práticas