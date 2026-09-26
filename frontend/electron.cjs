const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged;

function mimeFromName(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'dist', 'istinye-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL();
    if (url !== current) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    win.loadURL(pathToFileURL(indexPath).href);
  }

  win.once('ready-to-show', () => {
    if (isDev) return;
    try {
      const { autoUpdater } = require('electron-updater');
      const log = require('electron-log');
      autoUpdater.logger = log;
      autoUpdater.logger.transports.file.level = 'info';
      autoUpdater.checkForUpdatesAndNotify();
      autoUpdater.on('update-available', () => {
        console.log('Yeni bir WasteFlow güncellemesi bulundu.');
      });
      autoUpdater.on('update-downloaded', () => {
        autoUpdater.quitAndInstall();
      });
    } catch (err) {
      console.warn('Güncelleme kontrolü atlandı:', err.message);
    }
  });
}

ipcMain.handle('open-csv', async () => {
  const result = await dialog.showOpenDialog({
    title: 'CSV lot dosyası seçin',
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: ['csv', 'txt'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return {
    name: path.basename(result.filePaths[0]),
    text: fs.readFileSync(result.filePaths[0], 'utf8')
  };
});

ipcMain.handle('open-image', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Analiz için görsel seçin',
    properties: ['openFile'],
    filters: [{ name: 'Görseller', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const buf = fs.readFileSync(filePath);
  const mime = mimeFromName(filePath);
  return {
    name: path.basename(filePath),
    mime,
    data: buf.toString('base64')
  };
});

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function tcmbSelling(xml, code) {
  const parts = xml.split(`Kod="${code}"`);
  if (parts.length < 2) return null;
  const match = parts[1].match(/<ForexSelling>([0-9.]+)</);
  return match ? Number(match[1]) : null;
}

ipcMain.handle('fetch-route', async (_event, from, to) => {
  const qs = `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const bases = [
    'https://router.project-osrm.org',
    'https://routing.openstreetmap.de/routed-car'
  ];
  let lastErr;
  for (const base of bases) {
    try {
      return await fetchJson(`${base}/route/v1/driving/${qs}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('route-failed');
});

ipcMain.handle('fetch-fx', async () => {
  try {
    const xml = await (await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', { cache: 'no-store' })).text();
    const usdTry = tcmbSelling(xml, 'USD');
    const eurTry = tcmbSelling(xml, 'EUR');
    if (usdTry && eurTry) return { usdTry, eurTry, source: 'TCMB' };
  } catch {
    /* next */
  }
  try {
    const usd = await fetchJson('https://api.frankfurter.dev/v1/latest?from=USD&to=TRY');
    const eur = await fetchJson('https://api.frankfurter.dev/v1/latest?from=EUR&to=TRY');
    if (usd?.rates?.TRY && eur?.rates?.TRY) {
      return { usdTry: usd.rates.TRY, eurTry: eur.rates.TRY, source: 'ECB / frankfurter' };
    }
  } catch {
    /* next */
  }
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  const usdTry = data?.rates?.TRY;
  const eurPerUsd = data?.rates?.EUR;
  if (!usdTry || !eurPerUsd) throw new Error('fx-failed');
  return { usdTry, eurTry: usdTry / eurPerUsd, source: 'open.er-api.com' };
});

app.whenReady().then(() => {
  const { session } = require("electron");
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media" || permission === "camera" || permission === "microphone");
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
