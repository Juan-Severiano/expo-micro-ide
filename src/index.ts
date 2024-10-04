import { EventEmitter } from "expo-modules-core";
import { useEffect, useState } from "react";
import ExpoMicroIdeModule from "./ExpoMicroIdeModule";
import { ConnectionStatus } from "./ExpoMicroIdeModule.types";

interface UsbDevice {
  deviceName: string;
  productId: number;
  vendorId: number;
}

export const status = ExpoMicroIdeModule.status as string;
export const isConnected = ExpoMicroIdeModule.isConnected as boolean;
export const board = ExpoMicroIdeModule.board as string;

export function hello(): string {
  console.log({
    status,
    isConnected,
    board
  });
  return ExpoMicroIdeModule.hello();
}

const microIdeEventEmitter = new EventEmitter(ExpoMicroIdeModule);

export async function detectUsbDevices(): Promise<UsbDevice[]> {
  try {
    const devices: UsbDevice[] = await ExpoMicroIdeModule.detectUsbDevices();
    console.log("Dispositivos USB detectados:", devices);
    hello();
    return devices;
  } catch (error) {
    console.error("Erro ao detectar dispositivos USB:", error);
    throw error;
  }
}

export async function showFilesAndDirs(): Promise<any[]> {
  try {
    const files = await ExpoMicroIdeModule.showFilesAndDirs();
    console.log("Arquivos e diretórios:", files);
    return files;
  } catch (error) {
    console.error("Erro ao listar arquivos e diretórios:", error);
    throw error;
  }
}

export function useStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    ConnectionStatus.Connecting
  );

  useEffect(() => {
    const subscription = microIdeEventEmitter.addListener(
      "onStatusChange",
      (event: { status: ConnectionStatus }) => {
        console.log("Status mudou:", event.status);
        setStatus(event.status);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return status;
}
