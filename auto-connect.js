const automator = require('miniprogram-automator');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const IDE_FILE = 'C:\\Users\\Administrator\\AppData\\Local\\微信开发者工具\\User Data\\97c2c3ed9e9b4a343745d4ac3603eef1\\Default\\.ide';
const CLI_PATH = 'D:\\微信web开发者工具\\cli.bat';
const PROJECT_PATH = 'd:\\work\\wecaht app';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function main() {
    // Step 1: Kill existing DevTools
    log('Killing existing DevTools...');
    try {
        execSync('Get-Process wechatdevtools -ErrorAction SilentlyContinue | Stop-Process -Force', { shell: 'powershell' });
    } catch (e) {}
    await sleep(3000);

    // Step 2: Delete old .ide file
    try { fs.unlinkSync(IDE_FILE); } catch (e) {}
    log('Old .ide file deleted');

    // Step 3: Start DevTools with automation via CLI
    log('Starting DevTools with automation...');
    const cli = spawn('cmd', ['/c', CLI_PATH, 'auto', '--project', PROJECT_PATH, '--auto-port', '9420'], {
        stdio: 'pipe',
        shell: false
    });

    let cliOutput = '';
    cli.stdout.on('data', (data) => {
        const text = data.toString();
        cliOutput += text;
        log(`CLI: ${text.trim()}`);
    });
    cli.stderr.on('data', (data) => {
        log(`CLI ERR: ${data.toString().trim()}`);
    });

    // Step 4: Wait for .ide file to appear (max 60 seconds)
    log('Waiting for .ide file...');
    let port = null;
    for (let i = 0; i < 60; i++) {
        await sleep(1000);
        try {
            const content = fs.readFileSync(IDE_FILE, 'utf8').trim();
            if (content) {
                port = content;
                log(`IDE port found: ${port}`);
                break;
            }
        } catch (e) {
            // File doesn't exist yet
        }
    }

    if (!port) {
        log('ERROR: .ide file did not appear within 60 seconds');
        log(`CLI output: ${cliOutput}`);
        process.exit(1);
    }

    // Step 5: Wait a bit more for the project to fully load
    log('Waiting for project to load...');
    await sleep(5000);

    // Step 6: Try to connect
    log(`Connecting to ws://127.0.0.1:${port}...`);
    try {
        const mp = await automator.connect({
            wsEndpoint: `ws://127.0.0.1:${port}`,
            timeout: 30000
        });
        log('Connected successfully!');

        // Quick test
        const page = await mp.currentPage();
        log(`Current page: ${page.path}`);

        const info = await mp.systemInfo();
        log(`System: ${JSON.stringify({ windowWidth: info.windowWidth, windowHeight: info.windowHeight, platform: info.platform })}`);

        // Take a screenshot
        const screenshotPath = 'd:\\work\\wecaht app\\workstreams\\07-quality-review\\evidence\\2026-06-22\\test-connection.png';
        await mp.screenshot({ path: screenshotPath });
        log(`Screenshot saved: ${screenshotPath}`);

        await mp.close();
        log('Connection closed. Ready for full QA!');
    } catch (e) {
        log(`Connection failed: ${e.message}`);
        log(`CLI output was: ${cliOutput}`);
    }
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
