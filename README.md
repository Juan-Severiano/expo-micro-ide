# ExpoMicroIde

ExpoMicroIde is a npm module that provides a set of functions for interacting with microcontroller boards in Expo projects. It allows you to initialize connections, manage files, and perform various operations on the connected device.

## Table of Contents

- [ExpoMicroIde](#expomicroide)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Installation](#installation)
  - [How it Works](#how-it-works)
  - [API Reference](#api-reference)
    - [Types](#types)
    - [Functions](#functions)
  - [Usage Examples](#usage-examples)

## Getting Started

ExpoMicroIde is designed to work with Expo projects and provides a bridge between your React Native application and microcontroller boards. It offers functions for file management, device initialization, and basic operations.

## Installation

To install ExpoMicroIde in your Expo project, run the following command:

```bash
npm install expo-micro-ide
```

or if you're using yarn:

```bash
yarn add expo-micro-ide
```

## How it Works

ExpoMicroIde uses a native module (ExpoMicroIdeModule) to communicate with the microcontroller board. It provides a JavaScript interface to interact with the native functionality. The module handles USB device detection, file operations, and data transfer between your Expo app and the connected board.

## API Reference

### Types

```typescript
interface MicroFile {
  name: string;
  path: string;
  isFile: boolean;
  size?: number;
}
```

### Functions

1. `initialize(): Promise<string | Error>`
   - Initializes the connection with the microcontroller board.
   - Returns a promise that resolves to a success message or rejects with an error.

2. `files.list(): Promise<string | Error>`
   - Lists all files on the connected device.
   - Returns a promise that resolves to a success message or rejects with an error.

3. `hello(): string`
   - A simple function that returns a greeting message.
   - Returns: "Hello world Kotlin + Expo Modules! 👋"

4. `files.create(name: string): Promise<string | Error>`
   - Creates a new file with the given name.
   - Parameters:
     - `name`: The name of the file to create.
   - Returns a promise that resolves to a success message or rejects with an error.

5. `files.remove(fileName: string): Promise<string | Error>`
   - Deletes the specified file.
   - Parameters:
     - `fileName`: The name of the file to delete.
   - Returns a promise that resolves to a success message or rejects with an error.

6. `files.rename(oldName: string, newName: string): Promise<string | Error>`
   - Renames a file.
   - Parameters:
     - `oldName`: The current name of the file.
     - `newName`: The new name for the file.
   - Returns a promise that resolves to a success message or rejects with an error.

7. `files.read(path: string): Promise<string | Error>`
   - Reads the content of a file.
   - Parameters:
     - `path`: The path of the file to read.
   - Returns a promise that resolves to the file content or rejects with an error.

8. `files.write(path: string, content: string): Promise<string | Error>`
   - Writes content to a file.
   - Parameters:
     - `path`: The path of the file to write to.
     - `content`: The content to write to the file.
   - Returns a promise that resolves to a success message or rejects with an error.

## Usage Examples

Here's an example of how to use ExpoMicroIde in your Expo project:

```typescript
import * as ExpoMicroIde from "expo-micro-ide";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function App() {
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");

  async function connect() {
    try {
      const res = await ExpoMicroIde.initialize();
      setStatus(res as string);
    } catch (error) {
      setStatus(`Error connecting: \${error.message}`);
    }
  }

  async function listFiles() {
    try {
      const res = await ExpoMicroIde.files.list();
      setStatus(`Files: \${res}`);
    } catch (error) {
      setStatus(`Error listing files: \${error.message}`);
    }
  }

  async function createFile() {
    if (!fileName) {
      setStatus("File name is required");
      return;
    }
    try {
      await ExpoMicroIde.files.create(fileName);
      setStatus(`File '\${fileName}' created`);
    } catch (error) {
      setStatus(`Error creating file: \${error.message}`);
    }
  }

  async function readFile() {
    if (!fileName) {
      setStatus("File name is required for reading");
      return;
    }
    try {
      const content = await ExpoMicroIde.files.read(fileName);
      setContent(content as string);
      setStatus(`Content of '\${fileName}': \${content}`);
    } catch (error) {
      setStatus(`Error reading file: \${error.message}`);
    }
  }

  async function writeFile() {
    if (!fileName) {
      setStatus("File name is required for writing");
      return;
    }
    try {
      await ExpoMicroIde.files.write(fileName, content);
      setStatus(`Content written to '\${fileName}'`);
    } catch (error) {
      setStatus(`Error writing to file: \${error.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Status: {status}</Text>
      <Button title="Connect" onPress={connect} />
      <Button title="List Files" onPress={listFiles} />
      <TextInput
        value={fileName}
        onChangeText={setFileName}
        placeholder="File name"
      />
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="File content"
      />
      <Button title="Create File" onPress={createFile} />
      <Button title="Read File" onPress={readFile} />
      <Button title="Write to File" onPress={writeFile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

This example demonstrates how to use the main functions of ExpoMicroIde, including connecting to a device, listing files, creating, reading, and writing files.

Remember to handle errors appropriately in your application, as shown in the example above.
