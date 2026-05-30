const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 1000,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false); // optional: hide menu bar
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
