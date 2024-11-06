import ExpoMicroIdeModule from "./ExpoMicroIdeModule";

export interface MicroFile {
  name: string;
  path: string;
  isFile: boolean;
  size?: number;
}

export async function initialize(): Promise<string | Error> {
  return ExpoMicroIdeModule.initialize();
}

export async function listFiles(): Promise<string | Error> {
  return ExpoMicroIdeModule.listFiles();
}

export function hello(): string {
  return ExpoMicroIdeModule.hello();
}

export async function createFile(name: string): Promise<string | Error> {
  return ExpoMicroIdeModule.createFile(name);
}

export async function deleteFile(fileName: string): Promise<string | Error> {
  return ExpoMicroIdeModule.deleteFile(fileName);
}

export async function renameFile(oldName: string, newName: string): Promise<string | Error> {
  return ExpoMicroIdeModule.renameFile(oldName, newName);
}

export async function readFile(path: string): Promise<string | Error> {
  return ExpoMicroIdeModule.readFile(path);
}

export async function writeFile(path: string, content: string): Promise<string | Error> {
  return ExpoMicroIdeModule.writeFile(path, content);
}
