import { IpcRenderer } from "electron/renderer";

export interface IElectronApi {
  ping: () => Promise<string>;
  openFile: () => Promise<string>;
  setTitle: (title: string) => void;

  onUpdateCounter: (callback: (value: number) => void) => IpcRenderer;
  counterValue: (value: number) => void;
  appVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronApi: IElectronApi;
  }
}
