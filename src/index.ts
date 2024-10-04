import { EventEmitter } from "expo-modules-core";
import { useEffect, useState } from "react";

import ExpoMicroIdeModule from "./ExpoMicroIdeModule";
import { ConnectionStatus } from "./ExpoMicroIdeModule.types";

export const status = ExpoMicroIdeModule.status as string
export const isConnected = ExpoMicroIdeModule.isConnected as boolean
export const board = ExpoMicroIdeModule.board as string

export function hello(): string {
  console.log({
    status,
    isConnected,
    board
  })
  return ExpoMicroIdeModule.hello();
}


const microIdeEventEmitter = new EventEmitter(ExpoMicroIdeModule);

export async function detectUsbDevices(): Promise<string> {
  const res = await ExpoMicroIdeModule.detectUsbDevices();
  hello()
  return res;
}

export async function showFilesAndDirs() {
  const res = await ExpoMicroIdeModule.showFilesAndDirs();
  return res;
}

export function useStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(
    ConnectionStatus.Error,
  );

  useEffect(() => {
    const subscription = microIdeEventEmitter.addListener(
      "onStatusChange",
      (event: { status: ConnectionStatus }) => {
        console.log("Status changed:", event);
        setStatus(event.status ?? "");
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return status;
}
