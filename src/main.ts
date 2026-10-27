import { updateElectronApp } from "update-electron-app";
import {
  app,
  BrowserWindow,
  dialog,
  MenuItem,
  MenuItemConstructorOptions,
} from "electron";
import log from "electron-log";
import path from "node:path";
import started from "electron-squirrel-startup";
import { Menu, ipcMain } from "electron/main";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
// Initialize the logger to be available in renderer process
log.initialize();
log.info("Log from the main process");
log.info("App starting...");

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow;
let template: Array<MenuItemConstructorOptions | MenuItem> = [
  {
    label: "win32" + app.name,
    submenu: [
      {
        click: () => {
          mainWindow.webContents.send("update-counter", 1);
        },
        label: "Increment",
      },
      {
        click: () => {
          mainWindow.webContents.send("update-counter", -1);
        },
        label: "Decrement",
      },
    ],
  },
];

if (process.platform === "darwin") {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: "About " + name,
        role: "about",
      },
      {
        label: "Quit",
        accelerator: "Command+Q",
        click() {
          app.quit();
        },
      },
    ],
  });
}
console.log(path.join(__dirname, "preload.ts"));

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
  console.log(isDev);
  if (isDev) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }
  // 2. 菜单栏：生产模式去掉开发菜单
  if (!isDev) {
    // 可以自定义菜单，去掉 Reload / DevTools 等
    mainWindow.removeMenu();
  }
  if (!isDev) {
    // 自动更新：Electron Forge 官方方案，基于 update.electronjs.org
    // 读取 package.json 的 repository 字段确定仓库，无需 app-update.yml
    updateElectronApp({
      logger: log,
      updateInterval: "10 minutes",
    });
  }

  ipcMain.handle("ping", () => {
    return "12313";
  });
  ipcMain.handle("appVersion", () => {
    return app.getVersion();
  });

  ipcMain.handle("dialog:openFile", async (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents)!;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "你好呀",
    });
    if (!canceled) {
      return filePaths[0];
    }
  });

  ipcMain.on("set-title", (event, title) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win?.setTitle(title);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
