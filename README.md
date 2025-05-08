# ExpoMicroIde

A powerful Expo native module for interacting with microcontroller boards in React Native applications. This module provides a clean and type-safe interface for file system operations and board control.

## Features

- 🔌 Easy board connection and initialization
- 📁 Complete file system operations (read, write, list, create, delete, rename)
- ⚡ Script execution and control (run, pause, reset)
- 📊 Real-time status monitoring
- 🔒 Type-safe API with TypeScript support
- 🎯 Clean architecture design

## Installation

```bash
npm install expo-micro-ide
# or
yarn add expo-micro-ide
```

## Quick Start

```typescript
import { board, files } from 'expo-micro-ide';

// Initialize connection
await board.initialize();

// List files in root directory
const fileList = await files.list('/');

// Create and write to a file
await files.create('main.py');
await files.write('/main.py', 'print("Hello from MicroPython!")');

// Execute the script
await board.run();

// Monitor board status
board.onStatusChange((status) => {
  console.log('Board status:', status);
});
```

## API Reference

### File System Operations

The `files` object provides the following methods:

#### `list(path?: string): Promise<MicroFile[]>`
Lists files in the specified directory.
- `path`: Optional directory path (defaults to root)
- Returns: Array of MicroFile objects

#### `create(name: string, path?: string): Promise<string>`
Creates a new file.
- `name`: Name of the file to create
- `path`: Optional directory path
- Returns: Success message

#### `remove(fileName: string, path?: string): Promise<string>`
Deletes a file.
- `fileName`: Name of the file to delete
- `path`: Optional directory path
- Returns: Success message

#### `rename(oldName: string, newName: string, path?: string): Promise<string>`
Renames a file.
- `oldName`: Current file name
- `newName`: New file name
- `path`: Optional directory path
- Returns: Success message

#### `read(path: string): Promise<string>`
Reads file contents.
- `path`: Full path to the file
- Returns: File contents as string

#### `write(path: string, content: string): Promise<string>`
Writes content to a file.
- `path`: Full path to the file
- `content`: Content to write
- Returns: Success message

### Board Control

The `board` object provides the following methods:

#### `initialize(): Promise<string>`
Initializes connection with the board.
- Returns: Board identification string

#### `run(script?: string): Promise<string>`
Executes a Python script.
- `script`: Optional script content (defaults to main.py)
- Returns: Execution result

#### `pause(): Promise<string>`
Pauses current script execution.
- Returns: Success message

#### `reset(): Promise<string>`
Resets the board.
- Returns: Success message

#### `getLastOutput(): string`
Gets the last execution output.
- Returns: Last output or error message

#### `getConnectionStatus(): ConnectionStatus`
Gets current connection status.
- Returns: ConnectionStatus enum value

#### `getBoardStatus(): BoardStatus`
Gets current board execution status.
- Returns: BoardStatus enum value

### Event Listeners

#### `board.onStatusChange(callback: (status: BoardStatus) => void): () => void`
Subscribe to board status changes.
- Returns: Unsubscribe function

#### `board.onConnectionChange(callback: (status: ConnectionStatus) => void): () => void`
Subscribe to connection status changes.
- Returns: Unsubscribe function

### Types

```typescript
enum BoardStatus {
  RUNNING = "Running",
  PAUSED = "Paused",
  STOPPED = "Stopped",
  ERROR = "Error"
}

enum ConnectionStatus {
  CONNECTED = "Connected",
  CONNECTING = "Connecting",
  ERROR = "Error",
  DISCONNECTED = "Disconnected"
}

interface MicroFile {
  name: string;
  path: string;
  size: number;
  type: FileType;
  modifiedAt?: Date;
}

enum FileType {
  FILE = 0,
  DIRECTORY = 1
}
```

## Error Handling

The module uses a consistent error handling approach. All async operations may throw errors with the following types:

```typescript
enum ErrorType {
  CONNECTION_ERROR = "CONNECTION_ERROR",
  FILE_SYSTEM_ERROR = "FILE_SYSTEM_ERROR",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  DEVICE_ERROR = "DEVICE_ERROR"
}
```

Example error handling:

```typescript
try {
  await board.initialize();
    } catch (error) {
  if (error.code === ErrorType.CONNECTION_ERROR) {
    console.error('Connection failed:', error.message);
    }
  }
```

## Best Practices

1. Always initialize the board before performing any operations:
```typescript
await board.initialize();
```

2. Use the event listeners to monitor status changes:
```typescript
board.onStatusChange((status) => {
  if (status === BoardStatus.ERROR) {
    // Handle error state
  }
});
```

3. Clean up resources when done:
```typescript
const unsubscribe = board.onStatusChange(callback);
// Later...
unsubscribe();
```

4. Handle errors appropriately:
```typescript
try {
  await files.write('/main.py', code);
  await board.run();
} catch (error) {
  console.error('Operation failed:', error);
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see the LICENSE file for details.
