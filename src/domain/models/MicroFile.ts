/**
 * Represents a file in the microcontroller's filesystem
 */
export interface MicroFile {
  /** Name of the file */
  name: string;
  /** Full path to the file */
  path: string;
  /** Size of the file in bytes */
  size: number;
  /** Type of the file (0 for file, 1 for directory) */
  type: FileType;
  /** Last modified timestamp */
  modifiedAt?: Date;
}

/**
 * File type enumeration
 */
export enum FileType {
  FILE = 0,
  DIRECTORY = 1,
}

/**
 * Connection status enumeration
 */
export enum ConnectionStatus {
  CONNECTED = "Connected",
  CONNECTING = "Connecting",
  ERROR = "Error",
  DISCONNECTED = "Disconnected",
}

/**
 * Board execution status
 */
export enum BoardStatus {
  RUNNING = "Running",
  PAUSED = "Paused",
  STOPPED = "Stopped",
  ERROR = "Error",
}

/**
 * Error types that can occur during operations
 */
export enum ErrorType {
  CONNECTION_ERROR = "CONNECTION_ERROR",
  FILE_SYSTEM_ERROR = "FILE_SYSTEM_ERROR",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  DEVICE_ERROR = "DEVICE_ERROR",
}
