import ExpoMicroIdeModule from "./ExpoMicroIdeModule";
import { Files } from "./ExpoMicroIdeModule.types";

export interface MicroFile {
  name: string;
  type: number;
  size: number;
  path: string;
}

async function initialize(): Promise<string> {
  return ExpoMicroIdeModule.initialize();
}

export async function list(): Promise<MicroFile[]> {
  const response = await ExpoMicroIdeModule.listFiles();
  return JSON.parse(response) as MicroFile[];
}

function hello(): string {
  return ExpoMicroIdeModule.hello();
}

async function create(name: string): Promise<string> {
  return ExpoMicroIdeModule.createFile(name);
}

async function remove(fileName: string): Promise<string> {
  return ExpoMicroIdeModule.deleteFile(fileName);
}

async function rename(oldName: string, newName: string): Promise<string> {
  return ExpoMicroIdeModule.renameFile(oldName, newName);
}

async function read(path: string): Promise<string> {
  return ExpoMicroIdeModule.readFile(path);
}

async function write(path: string, content: string): Promise<string> {
  return ExpoMicroIdeModule.writeFile(path, content);
}

async function run() {
  return ExpoMicroIdeModule.executeScript();
}

async function pause() {
  return ExpoMicroIdeModule.pauseScript();
}

async function reset() {
  return ExpoMicroIdeModule.resetScript();
}

const files = {
  write, read, rename, remove, create, list
}

const board = {
  run,
  reset,
  pause
}

export {
  files,
  hello,
  initialize,
  type Files,
  board
}
