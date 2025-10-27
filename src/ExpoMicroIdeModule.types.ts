export enum ConnectionStatus {
  Connected = "connected",
  Connecting = "connecting",
  Error = "error",
  Approve = "approve",
}

export enum ConnectionError {
  NO_DEVICES = "NO_DEVICES",
  CANT_OPEN_PORT = "CANT_OPEN_PORT",
  CONNECTION_LOST = "CONNECTION_LOST",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NOT_SUPPORTED = "NOT_SUPPORTED",
  NO_DRIVER_FOUND = "NO_DRIVER_FOUND",
  NO_PORT_FOUND = "NO_PORT_FOUND",
  CANT_OPEN_CONNECTION = "CANT_OPEN_CONNECTION",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}

export type MicroDevice = {
  name: string;
  port: string;
  vendorId?: number;
  productId?: number;
  isMicroPython?: boolean;
}

export type Files = {
  name: string;
  type: number;
  size: number;
}

export type UsbDevice = {
  vendorId: number;
  productId: number;
  deviceName: string;
  manufacturerName?: string;
  productName?: string;
}

export interface ExpoMicroIdeInterface {
  initialize(): Promise<string>;
  detectUsbDevices(): Promise<boolean>;
  approveDevice(deviceId: string): Promise<boolean>;
  disconnectDevice(): Promise<boolean>;
  forgetDevice(): Promise<boolean>;
  getCurrentDevice(): Promise<MicroDevice | null>;
  
  listFiles(): Promise<Files[]>;
  createFile(name: string): Promise<string>;
  deleteFile(fileName: string): Promise<string>;
  renameFile(oldName: string, newName: string): Promise<string>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<string>;
  
  executeScript(code: string): Promise<string>;
  executeMain(): Promise<string>;
  pauseScript(): Promise<string>;
  resetScript(): Promise<string>;
  
  sendCommand(command: string): Promise<boolean>;
  sendCommandInSilentMode(command: string): Promise<string>;
  sendCtrlC(): Promise<boolean>;
  sendCtrlD(): Promise<boolean>;
  resetBoard(): Promise<boolean>;
  enterSilentMode(): Promise<boolean>;
  
  addListener(eventName: string, listener: (event: any) => void): { remove: () => void };
}
