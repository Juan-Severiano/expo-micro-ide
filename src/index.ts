import ExpoMicroIdeModule from "./ExpoMicroIdeModule";

export async function initialize() {
  return ExpoMicroIdeModule.initialize()
}

export async function listFiles() {
  return ExpoMicroIdeModule.listFiles()
}

export function hello() {
  return ExpoMicroIdeModule.hello()
}