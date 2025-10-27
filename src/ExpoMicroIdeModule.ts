import { EventEmitter, requireNativeModule } from 'expo-modules-core';
import { ConnectionStatus, ConnectionError, MicroDevice, Files, UsbDevice } from './ExpoMicroIdeModule.types';

const ExpoMicroIdeModule = requireNativeModule('ExpoMicroIde')

const emitter = new EventEmitter(ExpoMicroIdeModule);

export { ConnectionStatus, ConnectionError, MicroDevice, Files, UsbDevice };

export default class ExpoMicroIde {
  static initialize(): Promise<string> {
    return ExpoMicroIdeModule.initialize();
  }

  static detectUsbDevices(): Promise<boolean> {
    return ExpoMicroIdeModule.detectUsbDevices();
  }

  static approveDevice(deviceId: string): Promise<boolean> {
    return ExpoMicroIdeModule.approveDevice(deviceId);
  }

  static disconnectDevice(): Promise<boolean> {
    return ExpoMicroIdeModule.disconnectDevice();
  }

  static forgetDevice(): Promise<boolean> {
    return ExpoMicroIdeModule.forgetDevice();
  }

  static getCurrentDevice(): Promise<MicroDevice | null> {
    return ExpoMicroIdeModule.getCurrentDevice();
  }

  static listFiles(): Promise<Files[]> {
    return ExpoMicroIdeModule.listFiles();
  }

  static createFile(name: string): Promise<string> {
    return ExpoMicroIdeModule.createFile(name);
  }

  static deleteFile(fileName: string): Promise<string> {
    return ExpoMicroIdeModule.deleteFile(fileName);
  }

  static renameFile(oldName: string, newName: string): Promise<string> {
    return ExpoMicroIdeModule.renameFile(oldName, newName);
  }

  static readFile(path: string): Promise<string> {
    return ExpoMicroIdeModule.readFile(path);
  }

  static writeFile(path: string, content: string): Promise<string> {
    return ExpoMicroIdeModule.writeFile(path, content);
  }

  static executeScript(code: string): Promise<string> {
    return ExpoMicroIdeModule.executeScript(code);
  }

  static executeMain(): Promise<string> {
    return ExpoMicroIdeModule.executeMain();
  }

  static pauseScript(): Promise<string> {
    return ExpoMicroIdeModule.pauseScript();
  }

  static resetScript(): Promise<string> {
    return ExpoMicroIdeModule.resetScript();
  }

  static sendCommand(command: string): Promise<boolean> {
    return ExpoMicroIdeModule.sendCommand(command);
  }

  static sendCommandInSilentMode(command: string): Promise<string> {
    return ExpoMicroIdeModule.sendCommandInSilentMode(command);
  }

  static sendCtrlC(): Promise<boolean> {
    return ExpoMicroIdeModule.sendCtrlC();
  }

  static sendCtrlD(): Promise<boolean> {
    return ExpoMicroIdeModule.sendCtrlD();
  }

  static resetBoard(): Promise<boolean> {
    return ExpoMicroIdeModule.resetBoard();
  }

  static enterSilentMode(): Promise<boolean> {
    return ExpoMicroIdeModule.enterSilentMode();
  }

  static addStatusListener(listener: (event: { status: string, device?: MicroDevice, error?: string, message?: string, devices?: UsbDevice[] }) => void): { remove: () => void } {
    // @ts-ignore
    return emitter.addListener('onStatusChanges', listener);
  }

  static addDataListener(listener: (event: { data: string }) => void): { remove: () => void } {
    // @ts-ignore
    return emitter.addListener('onReceiveData', listener);
  }

  static addBoardConnectListener(listener: (event: { device: MicroDevice }) => void): { remove: () => void } {
    // @ts-ignore
    return emitter.addListener('onBoardConnect', listener);
  }

  static addBoardDisconnectListener(listener: (event: { device: MicroDevice | null }) => void): { remove: () => void } {
    // @ts-ignore
    return emitter.addListener('onBoardDisconnect', listener);
  }

  static addConnectionErrorListener(listener: (event: { error: string, message: string }) => void): { remove: () => void } {
    // @ts-ignore
    return emitter.addListener('onConnectionError', listener);
  }

  static addFilesUpdateListener(listener: (event: { files: Files[] }) => void): { remove: () => void } {
    // @ts-ignore
    return emitter.addListener('onFilesUpdate', listener);
  }
}
