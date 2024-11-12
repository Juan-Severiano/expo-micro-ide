import ExpoMicroIdeModule from "./ExpoMicroIdeModule";
import { Files } from "./ExpoMicroIdeModule.types";

export interface MicroFile {
  name: string;
  path: string;
  isFile: boolean;
  size?: number;
}

async function initialize(): Promise<string | Error> {
  return ExpoMicroIdeModule.initialize();
}

async function list(): Promise<Files[]> {
  const response = await ExpoMicroIdeModule.listFiles();
  return JSON.parse(response)
}

function hello(): string {
  return ExpoMicroIdeModule.hello();
}

async function create(name: string): Promise<string | Error> {
  return ExpoMicroIdeModule.createFile(name);
}

async function remove(fileName: string): Promise<string | Error> {
  return ExpoMicroIdeModule.deleteFile(fileName);
}

async function rename(oldName: string, newName: string): Promise<string | Error> {
  return ExpoMicroIdeModule.renameFile(oldName, newName);
}

async function read(path: string): Promise<string | Error> {
  return ExpoMicroIdeModule.readFile(path);
}

async function write(path: string, content: string): Promise<string | Error> {
  return ExpoMicroIdeModule.writeFile(path, content);
}

const files = {
  write, read, rename, remove, create, list
}

export {
  files,
  hello,
  initialize,
  type Files
}
