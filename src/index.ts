import { IBoard } from './domain/interfaces/IBoard';
import { IFileSystem } from './domain/interfaces/IFileSystem';
import { BoardStatus, ConnectionStatus, ErrorType, FileType, MicroFile } from './domain/models/MicroFile';
import ExpoMicroIdeModule from './ExpoMicroIdeModule';

/**
 * Implementation of the file system interface
 */
class FileSystem implements IFileSystem {
  async list(path?: string): Promise<MicroFile[]> {
    const response = await ExpoMicroIdeModule.listFiles(path);
  return JSON.parse(response) as MicroFile[];
}

  async create(name: string, path?: string): Promise<string> {
    return ExpoMicroIdeModule.createFile(name, path);
}

  async remove(fileName: string, path?: string): Promise<string> {
    return ExpoMicroIdeModule.deleteFile(fileName, path);
}

  async rename(oldName: string, newName: string, path?: string): Promise<string> {
    return ExpoMicroIdeModule.renameFile(oldName, newName, path);
}

  async read(path: string): Promise<string> {
  return ExpoMicroIdeModule.readFile(path);
}

  async write(path: string, content: string): Promise<string> {
  return ExpoMicroIdeModule.writeFile(path, content);
}
}

/**
 * Implementation of the board interface
 */
class Board implements IBoard {
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private boardStatus: BoardStatus = BoardStatus.STOPPED;
  private lastOutput: string = '';
  private statusListeners: ((status: BoardStatus) => void)[] = [];
  private connectionListeners: ((status: ConnectionStatus) => void)[] = [];

  async initialize(): Promise<string> {
    try {
      this.setConnectionStatus(ConnectionStatus.CONNECTING);
      const result = await ExpoMicroIdeModule.initialize();
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      return result;
    } catch (error) {
      this.setConnectionStatus(ConnectionStatus.ERROR);
      throw error;
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getBoardStatus(): BoardStatus {
    return this.boardStatus;
  }

  async run(script?: string): Promise<string> {
    try {
      this.setBoardStatus(BoardStatus.RUNNING);
      const result = await ExpoMicroIdeModule.executeScript(script);
      this.lastOutput = result;
      return result;
    } catch (error) {
      this.setBoardStatus(BoardStatus.ERROR);
      throw error;
    }
}

  async pause(): Promise<string> {
    try {
      const result = await ExpoMicroIdeModule.pauseScript();
      this.setBoardStatus(BoardStatus.PAUSED);
      return result;
    } catch (error) {
      this.setBoardStatus(BoardStatus.ERROR);
      throw error;
    }
  }

  async reset(): Promise<string> {
    try {
      const result = await ExpoMicroIdeModule.resetScript();
      this.setBoardStatus(BoardStatus.STOPPED);
      this.lastOutput = '';
      return result;
    } catch (error) {
      this.setBoardStatus(BoardStatus.ERROR);
      throw error;
    }
  }

  getLastOutput(): string {
    return this.lastOutput;
  }

  onStatusChange(callback: (status: BoardStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    };
  }

  private setBoardStatus(status: BoardStatus) {
    this.boardStatus = status;
    this.statusListeners.forEach(cb => cb(status));
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.connectionListeners.forEach(cb => cb(status));
  }
}

// Create instances
const board = new Board();
const files = new FileSystem();

// Export public API
export {
  board,
  files,
  // Types
  BoardStatus,
  ConnectionStatus,
  ErrorType,
  FileType,
  type MicroFile,
  type IBoard,
  type IFileSystem
};
