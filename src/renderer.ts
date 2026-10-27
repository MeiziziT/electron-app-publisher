/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import "./index.css";

console.log(
  "👋 This message is being logged by the renderer process, included via Vite",
);

const appVersion = document.querySelector("#appVersion")!;
const func = async () => {
  const response = await window.electronApi.ping();
  const version = await window.electronApi.appVersion();
  appVersion.innerHTML = version;
  console.log(response); // 打印 'pong'
};

func();

const setButton = document.getElementById("btn");
const titleInput = document.getElementById("title") as HTMLInputElement;
setButton?.addEventListener("click", () => {
  const title = titleInput?.value;
  window.electronApi.setTitle(title);
});

const btn = document.getElementById("btn2")!;
const filePathElement = document.getElementById("filePath")!;

btn.addEventListener("click", async () => {
  const filePath = await window.electronApi.openFile();
  filePathElement.innerText = filePath;
});

const counter = document.getElementById("counter")!;
const ipcRenderer = window.electronApi.onUpdateCounter((value) => {
  const oldValue = Number(counter.innerText);
  const newValue = oldValue + value;
  counter.innerText = newValue.toString();
  window.electronApi.counterValue(newValue);
});

ipcRenderer.invoke("ping");
