import { app, BrowserWindow } from 'electron';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const parseArg = (arg: string) => {
  switch (arg) {
    case '-c':
      return {
        circle: true
      }
    default:
      return {
        videoDeviceName: arg
      }
  }
}

const createWindow = (): void => {
  const options: {
    videoDeviceName?: string,
    circle?: boolean
  }= process.argv.slice(2).reduce((opts, arg) => {
    const parsed = parseArg(arg)
    return Object.assign(opts, parsed)
  }, {})

  console.log({options})

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 240,
    width: options.circle ? 240 : 340,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    frame: false,
    transparent: true,
    skipTaskbar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  mainWindow.setAlwaysOnTop(true)

  if (options.circle) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript('setCircle()')
    })
  }

  if (options.videoDeviceName) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript('window.videoDeviceName = "' + options.videoDeviceName + '"')
    })
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

