import { EventEmitter } from "expo-modules-core";
import { useEffect, useState } from "react";

import ExpoMicroIdeModule from "./ExpoMicroIdeModule";
import { ConnectionStatus } from "./ExpoMicroIdeModule.types";

export function hello(): string {
  return ExpoMicroIdeModule.hello();
}

const microIdeEventEmitter = new EventEmitter(ExpoMicroIdeModule);

export async function detectUsbDevices(): Promise<string> {
  const res = await ExpoMicroIdeModule.detectUsbDevices();
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
