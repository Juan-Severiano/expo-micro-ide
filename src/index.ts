import ExpoMicroIdeModule from "./ExpoMicroIdeModule";

export function hello(): string {
  return ExpoMicroIdeModule.hello();
}

export async function connectUSB(): Promise<string> {
  const res = await ExpoMicroIdeModule.connectUSB();
  console.log("Hello coder, are you seeing me?");
  return res;
}
