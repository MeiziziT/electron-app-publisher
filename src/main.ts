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
import {
  autoUpdater,
  UpdateDownloadedEvent,
  UpdateInfo,
  type AppUpdater,
} from "electron-updater";
import { Menu, ipcMain } from "electron/main";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
// Initialize the logger to be available in renderer process
log.initialize();
log.info("Log from the main process");

autoUpdater.logger = log;
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

function sendStatusToWindow(text: string) {
  log.info(text);
  mainWindow.webContents.send("message", text);
}

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
autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});
autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("Update available.");
});
autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});
autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  sendStatusToWindow(log_message);
});
autoUpdater.on("update-downloaded", (info) => {
  sendStatusToWindow("Update downloaded");
});
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
    // 自动更新 + 提示
    updateElectronApp({
      logger: console,
      updateInterval: "10 minutes",
    });

    // 监听更新事件， 弹框提示用户

    // 检测到新版本，开始下载
    autoUpdater.on("update-available", (updateInfo: UpdateInfo) => {
      const { releaseNotes, releaseName, releaseDate } = updateInfo;
      log.info(JSON.stringify(updateInfo, null, 2));
      log.info(`发现新版本: ${releaseName}, 开始下载...`);
    });

    // 下载完成，提示用户重启
    autoUpdater.on(
      "update-downloaded",
      (updateDownloadEvent: UpdateDownloadedEvent) => {
        const { releaseName, releaseDate } = updateDownloadEvent;
        dialog
          .showMessageBox(mainWindow, {
            type: "info",
            title: "更新就绪",
            message: `新版本 ${releaseName} 已下载完成`,
            detail: "无更新说明",
            buttons: ["稍后重启", "立即重启"],
            defaultId: 1,
            cancelId: 0,
          })
          .then(({ response }) => {
            if (response === 1) {
              autoUpdater.quitAndInstall(false, true);
            }
          });
      },
    );
    // 没有新版本
    autoUpdater.on("update-not-available", () => {
      log.info("当前已是最新版本");
    });
    autoUpdater.on("error", (err) => {
      log.error("更新出错:", err);
    });
  }

  ipcMain.handle("ping", () => {
    return "12313";
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

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
