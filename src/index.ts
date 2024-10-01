import { EventEmitter } from "expo-modules-core";
import { useEffect, useState } from "react";

import ExpoMicroIdeModule from "./ExpoMicroIdeModule";

export function hello(): string {
  return ExpoMicroIdeModule.hello();
}

const microIdeEventEmitter = new EventEmitter(ExpoMicroIdeModule);

export async function detectUsbDevices(): Promise<string> {
  const res = await ExpoMicroIdeModule.detectUsbDevices();
  return res;
}

export function useStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const subscription = microIdeEventEmitter.addListener(
      "onConnectionStatusChange",
      (event) => {
        console.log("Status changed:", event);
        setStatus(event);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return status;
}
