const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

app.name = 'Relay';
let nextProcess = null;
let mainWindow = null;
const PORT = 3999; // Choose a port that is unlikely to conflict

// 1. Function to check when the Next.js server is ready
function checkServerReady(callback) {
    const req = http.request({ host: 'localhost', port: PORT, method: 'GET', path: '/' }, (res) => {
        if (res.statusCode === 200) {
            callback();
        } else {
            setTimeout(() => checkServerReady(callback), 100);
        }
    });
    req.on('error', () => {
        setTimeout(() => checkServerReady(callback), 100);
    });
    req.end();
}

// 2. Start the Standalone Next.js Server
function startNextServer() {
    const isProd = app.isPackaged;

    // Resolve path to the Next.js standalone server.js file
    const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');

    // Resolve the working directory where database/data folder should live
    const workingDir = isProd ? app.getPath('userData') : app.getAppPath();

    // Create the directory if it doesn't exist
    if (isProd && !fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir, { recursive: true });
    }


    // Spawn the server process using node (or bun if you package the bundle with Bun)
    nextProcess = spawn('/Users/shubham007/.bun/bin/bun', [serverPath], {
        env: {
            cwd: workingDir,
            ...process.env,
            PORT: PORT.toString(),
            HOSTNAME: 'localhost',
            NODE_ENV: isProd ? 'production' : 'development',
            IS_PACKAGED: isProd ? 'true' : 'false'
        },
        stdio: 'inherit' // Pipe server logs to terminal
    });
}

function createWindow() {
    if (mainWindow) return;

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'app', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false, // Hide initially until ready-to-show
    });

    // Load the running Next.js application
    mainWindow.loadURL(`http://localhost:${PORT}`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Force the app to foreground on macOS after the asynchronous server wait
        if (process.platform === 'darwin') {
            app.focus({ steal: true });
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startNextServer();

    if (process.platform === 'darwin') {
        const { nativeImage } = require('electron');
        const iconPath = path.join(__dirname, 'app', 'icon.png');
        app.dock.setIcon(nativeImage.createFromPath(iconPath));
    }

    // Wait for the Next.js server to reply, then open the window
    checkServerReady(() => {
        createWindow();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Clean up: terminate Next.js background process when app closes
app.on('window-all-closed', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
});
