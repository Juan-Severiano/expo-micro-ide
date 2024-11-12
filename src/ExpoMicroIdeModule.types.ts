export enum ConnectionStatus {
  Connect = "Connected",
  Connecting = "Connecting",
  Error = "Sem Dispositivos",
  Approve = "Approve",
}

export type Files = {
  name: string
  type: number
  size: number
}
