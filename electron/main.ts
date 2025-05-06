
import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // In development, load from localhost
  // In production, load from the dist folder
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
