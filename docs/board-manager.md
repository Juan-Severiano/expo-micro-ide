# BoardManager

## Visão Geral

O `BoardManager` é responsável por gerenciar a conexão USB Serial entre o microcontrolador e o smartphone. Ele fornece uma interface para enviar e receber dados/comandos, além de gerenciar eventos de conexão e desconexão.

## Funcionalidades

- Detecção automática de dispositivos USB compatíveis
- Gerenciamento de permissões USB
- Conexão serial com dispositivos MicroPython e CircuitPython
- Envio e recebimento de dados/comandos
- Prevenção de erros de chamadas duplicadas
- Notificações de eventos de conexão e desconexão

## Eventos

O `BoardManager` fornece os seguintes callbacks para notificar sobre eventos:

- `onStatusChanges`: Notifica sobre mudanças no status da conexão
- `onReceiveData`: Notifica quando novos dados são recebidos
- `onBoardConnect`: Notifica quando um dispositivo é conectado
- `onBoardDisconnect`: Notifica quando um dispositivo é desconectado
- `onConnectionError`: Notifica quando ocorre um erro de conexão

## Uso Básico

```kotlin
// Criar uma instância do BoardManager
val boardManager = BoardManager(
    context = activity,
    onStatusChanges = { status ->
        // Tratar mudanças de status
        when (status) {
            is ConnectionStatus.Connected -> {
                // Dispositivo conectado
            }
            is ConnectionStatus.Error -> {
                // Erro de conexão
            }
            // ...
        }
    },
    onReceiveData = { data ->
        // Processar dados recebidos
    },
    onBoardConnect = { device ->
        // Dispositivo conectado
    },
    onBoardDisconnect = { device ->
        // Dispositivo desconectado
    },
    onConnectionError = { error, message ->
        // Tratar erro de conexão
    }
)

// Detectar dispositivos USB
boardManager.detectUsbDevices()

// Enviar código para o dispositivo
boardManager.write("print('Hello, World!')")

// Enviar código em modo silencioso
boardManager.writeInSilentMode("import machine", onResponse = { result ->
    // Processar resultado
})
```

## Ciclo de Vida

O `BoardManager` implementa `DefaultLifecycleObserver` para gerenciar o ciclo de vida da conexão junto com a Activity. Ele automaticamente:

- Inicia a detecção de dispositivos quando a Activity é criada
- Fecha a conexão e libera recursos quando a Activity é destruída

## Tratamento de Erros

O `BoardManager` fornece tratamento de erros robusto para diferentes cenários:

- `NO_DEVICES`: Nenhum dispositivo USB conectado
- `PERMISSION_DENIED`: Permissão USB negada
- `NO_DRIVER_FOUND`: Nenhum driver encontrado para o dispositivo
- `NO_PORT_FOUND`: Nenhuma porta serial encontrada
- `CANT_OPEN_CONNECTION`: Não foi possível abrir a conexão com o dispositivo
- `CANT_OPEN_PORT`: Não foi possível abrir a porta serial
- `CONNECTION_LOST`: Conexão perdida com o dispositivo
- `UNEXPECTED_ERROR`: Erro inesperado

## Prevenção de Erros

O `BoardManager` implementa mecanismos para prevenir erros comuns:

- Evita chamadas duplicadas durante o processo de conexão
- Gerencia corretamente o ciclo de vida da conexão
- Trata erros de permissão USB
- Notifica sobre erros e desconexões