// oxlint-disable eslint-plugin-unicorn/no-empty-file
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer } from "electron/renderer";
import { contextBridge } from "electron";
import { IElectronApi } from "./interface";

const electronApi: IElectronApi = {
  ping: () => ipcRenderer.invoke("ping"),
  setTitle: (title: string) => ipcRenderer.send("set-title", title),
  openFile: () => ipcRenderer.invoke("dialog:openFile"),

  onUpdateCounter: (callback) =>
    ipcRenderer.on("update-counter", (_event, value) => callback(value)),
  counterValue: (value: number) => value,
};
contextBridge.exposeInMainWorld("electronApi", electronApi);
