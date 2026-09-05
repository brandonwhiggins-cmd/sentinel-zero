const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
app.setName('Sentinel Zero');

const path = require('path');
const fs = require('fs');
const { exec, execSync, execFile } = require('child_process');

let mainWindow;

// Determine environment from command line flags
const isTestEnv = process.argv.includes('--env=test') || process.argv.includes('--test');

function detectLocalGamertags() {
  const res = {};

  // 1. Xbox Live Gamertag from Windows Registry
  try {
    const stdout = execSync('reg query "HKCU\\Software\\Microsoft\\XboxLive" /v Gamertag', { encoding: 'utf-8' });
    const m = stdout.match(/Gamertag\s+REG_SZ\s+(.+)/);
    if (m) {
      res.xbox = {
        gamertag: m[1].trim(),
        source: 'Windows Xbox Live'
      };
    }
  } catch (e) {}

  // 2. Steam Persona & SteamID from loginusers.vdf
  const steamPaths = [
    'C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf',
    'D:\\SteamLibrary\\config\\loginusers.vdf',
    'D:\\Steam\\config\\loginusers.vdf'
  ];
  for (const sp of steamPaths) {
    if (fs.existsSync(sp)) {
      try {
        const c = fs.readFileSync(sp, 'utf-8');
        const pMatch = c.match(/"PersonaName"\s+"([^"]+)"/);
        const aMatch = c.match(/"AccountName"\s+"([^"]+)"/);
        const sMatch = c.match(/"(7656119\d+)"/);
        if (pMatch) {
          res.steam = {
            gamertag: pMatch[1],
            account: aMatch ? aMatch[1] : '',
            id: sMatch ? sMatch[1] : '',
            source: 'Steam Local Client'
          };
          break;
        }
      } catch (e) {}
    }
  }

  // 3. Battle.net
  const bnetPath = path.join(process.env.APPDATA || '', 'Battle.net', 'Battle.net.config');
  if (fs.existsSync(bnetPath)) {
    try {
      const bc = fs.readFileSync(bnetPath, 'utf-8');
      const bm = bc.match(/"SavedAccountNames":\s*"([^",]+)/);
      if (bm) {
        const email = bm[1];
        res.activision = {
          gamertag: email.split('@')[0],
          email: email,
          source: 'Battle.net Desktop App'
        };
      }
    } catch (e) {}
  }

  // 4. Ubisoft Connect
  const ubiDir = path.join(process.env.LOCALAPPDATA || '', 'Ubisoft Game Launcher');
  if (fs.existsSync(ubiDir)) {
    const fallbackTag = res.xbox?.gamertag || res.steam?.gamertag || 'Operative';
    res.ubisoft = {
      gamertag: fallbackTag,
      id: 'Ubi_' + fallbackTag,
      source: 'Ubisoft Connect Local Client'
    };
  }

  // 5. EA App / Origin
  const eaDir = path.join(process.env.LOCALAPPDATA || '', 'Electronic Arts', 'EA Desktop');
  if (fs.existsSync(eaDir)) {
    const fallbackTag = res.xbox?.gamertag || res.steam?.gamertag || 'Operative';
    res.ea = {
      gamertag: fallbackTag,
      id: 'EA_' + fallbackTag,
      source: 'EA App Desktop'
    };
  }

  // 6. Battlestate Games (Escape from Tarkov)
  const bsgDir = path.join(process.env.APPDATA || '', 'Battlestate Games', 'BsgLauncher');
  if (fs.existsSync(bsgDir)) {
    const fallbackTag = res.xbox?.gamertag || res.steam?.gamertag || 'Operative';
    res.tarkov = {
      gamertag: fallbackTag,
      id: 'PMC_' + fallbackTag,
      source: 'Battlestate Games Launcher'
    };
  }

  return res;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#070a10',
    title: isTestEnv ? 'Sentinel Zero [TEST ENVIRONMENT]' : 'Sentinel Zero',
    icon: path.join(__dirname, 'sentinel_shield.ico'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Cloud-First Live Parity Architecture:
  // PROD and TEST clients always pull live from the cloud so any push updates both rigs in real-time.
  const PROD_URL = 'https://www.sentinelzero.gg/client.html';
  const TEST_URL = 'https://www.sentinelzero.gg/test-client.html';
  const targetUrl = isTestEnv ? TEST_URL : PROD_URL;
  const localPage = isTestEnv ? 'test-client.html' : 'client.html';

  // Flush stale HTTP cache on launch so new deployments take effect instantly
  session.defaultSession.clearCache().catch(() => {});

  // Load live cloud URL with cache bypass headers, fallback gracefully to bundled local package if offline
  mainWindow.loadURL(targetUrl, {
    extraHeaders: 'pragma: no-cache\ncache-control: no-cache\n'
  }).catch((err) => {
    console.warn(`[Sentinel Zero] Cloud sync unreachable (${err.message}). Loading local fallback package.`);
    mainWindow.loadFile(path.join(__dirname, localPage));
  });

  // Fail-safe handler: if remote navigation fails, fallback to local disk
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[Sentinel Zero] Cloud navigation failed (${errorCode}: ${errorDescription}) on ${validatedURL}. Switching to local package.`);
    if (validatedURL && validatedURL.startsWith('http')) {
      mainWindow.loadFile(path.join(__dirname, localPage));
    }
  });

  // Instant Cloud Hot-Reload: F5, Ctrl+R, or Ctrl+Shift+R triggers immediate cache-bypassed reload
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') {
      mainWindow.webContents.reloadIgnoringCache();
      event.preventDefault();
    } else if (input.key === 'F5') {
      mainWindow.webContents.reloadIgnoringCache();
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Failsafe: guarantee window is displayed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 1000);

  // Native Frameless Window Controls
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) {
      if (win.isMaximized() || win.isFullScreen()) {
        win.unmaximize();
        win.setFullScreen(false);
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) win.close();
  });

  // Real Gamertag Discovery Handler
  ipcMain.handle('detect-gamertags', async () => {
    return detectLocalGamertags();
  });

  // System Profile & Identity Handler
  ipcMain.handle('get-system-profile', () => {
    return {
      username: process.env.USERNAME || 'Operative'
    };
  });

  // Active In-Game Status Handler
  ipcMain.handle('get-in-game-status', async () => {
    return new Promise((resolve) => {
      scanRunningGames((detectedGame) => {
        resolve({ inGame: !!detectedGame, gameName: detectedGame || null });
      });
    });
  });

  // Universal Game Launcher Dispatcher
  ipcMain.on('launch-game', (event, uri, gameName) => {
    if (!uri) return;

    // Immediately flag active game session
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('active-game-status', {
        inGame: true,
        gameName: gameName || 'Attested Game',
        deltaSeconds: 0
      });
    }

    // Special Auto-Discovery for Tarkov / BSG
    if (uri.includes('bsglauncher') || uri.includes('bsg') || uri.includes('tarkov')) {
      findAndLaunchBSG(uri);
      return;
    }

    // Standard Platform URIs (Steam, Battle.net, Xbox, Epic, EA, Ubisoft)
    shell.openExternal(uri);
  });

  // Background Attested Game Process Telemetry (Runs every 30s)
  const processCheckInterval = setInterval(() => {
    scanRunningGames((detectedGame) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('active-game-status', {
          inGame: !!detectedGame,
          gameName: detectedGame || null,
          deltaSeconds: detectedGame ? 30 : 0
        });
      }
    });
  }, 30000);

  mainWindow.on('closed', () => {
    clearInterval(processCheckInterval);
  });
}

// Attested competitive game processes tracked by Sentinel Zero
const ATTESTED_GAME_PROCESSES = {
  'cs2.exe': 'Counter-Strike 2',
  'rainbowsix.exe': 'Rainbow Six Siege',
  'rainbowsix_vulkan.exe': 'Rainbow Six Siege',
  'escapefromtarkov.exe': 'Escape from Tarkov',
  'bsglauncher.exe': 'Escape from Tarkov',
  'cod.exe': 'Call of Duty / Warzone',
  'bootstrapper.exe': 'Call of Duty / Warzone',
  'r5apex.exe': 'Apex Legends',
  'valorant-win64-shipping.exe': 'Valorant',
  'rocketleague.exe': 'Rocket League',
  'fortniteclient-win64-shipping.exe': 'Fortnite',
  'tslgame.exe': 'PUBG: BATTLEGROUNDS',
  'league of legends.exe': 'League of Legends',
  'rustclient.exe': 'Rust',
  'fc25.exe': 'EA SPORTS FC 25',
  'overwatch.exe': 'Overwatch 2',
  'madden25.exe': 'Madden NFL 25',
  'nba2k25.exe': 'NBA 2K25'
};

function scanRunningGames(callback) {
  execFile('tasklist', ['/FO', 'CSV', '/NH'], (err, stdout) => {
    if (err || !stdout) {
      if (callback) callback(null);
      return;
    }
    const lower = stdout.toLowerCase();
    for (const [proc, gameName] of Object.entries(ATTESTED_GAME_PROCESSES)) {
      if (lower.includes('"' + proc + '"')) {
        if (callback) callback(gameName);
        return;
      }
    }
    if (callback) callback(null);
  });
}

function findAndLaunchBSG(uri) {
  const startMenuPaths = [
    path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft\\Windows\\Start Menu\\Programs\\Battlestate Games\\Battlestate Games Launcher.lnk'),
    path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs\\Battlestate Games\\Battlestate Games Launcher.lnk')
  ];

  for (const sc of startMenuPaths) {
    if (fs.existsSync(sc)) {
      shell.openPath(sc);
      return;
    }
  }

  const regCmd = 'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "Battlestate Games Launcher"';
  exec(regCmd, (err, stdout) => {
    if (!err && stdout) {
      const match = stdout.match(/HKEY_LOCAL_MACHINE[^\r\n]+/);
      if (match) {
        const keyPath = match[0];
        exec(`reg query "${keyPath}" /v InstallLocation`, (locErr, locStdout) => {
          if (!locErr && locStdout) {
            const locMatch = locStdout.match(/InstallLocation\s+REG_SZ\s+(.+)/);
            if (locMatch) {
              const exe = path.join(locMatch[1].trim(), 'BsgLauncher.exe');
              if (fs.existsSync(exe)) {
                execFile(exe);
                return;
              }
            }
          }
        });
      }
    }

    for (const d of ['C', 'D', 'E', 'F', 'G']) {
      const candidate = `${d}:\\Games\\BsgLauncher\\BsgLauncher.exe`;
      if (fs.existsSync(candidate)) {
        execFile(candidate);
        return;
      }
    }

    shell.openExternal(uri);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
