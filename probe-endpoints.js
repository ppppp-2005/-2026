const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const port = fs.readFileSync('C:\\Users\\Administrator\\AppData\\Local\\微信开发者工具\\User Data\\97c2c3ed9e9b4a343745d4ac3603eef1\\Default\\.ide', 'utf8').trim();
console.log('Port:', port);

// Try various HTTP endpoints
const paths = ['/', '/ws', '/automator', '/json', '/json/version', '/json/list', '/debug', '/api', '/status', '/health'];

async function tryHttp(path) {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}${path}`, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                console.log(`HTTP ${path}: ${res.statusCode} - ${d.substring(0, 100)}`);
                resolve();
            });
        }).on('error', e => {
            console.log(`HTTP ${path}: ERROR - ${e.message}`);
            resolve();
        });
        req.setTimeout(2000, () => { req.destroy(); resolve(); });
    });
}

async function tryWs(path) {
    return new Promise((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
        const timeout = setTimeout(() => {
            ws.close();
            console.log(`WS ${path}: TIMEOUT`);
            resolve();
        }, 2000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log(`WS ${path}: CONNECTED!`);
            ws.close();
            resolve();
        });
        
        ws.on('error', (err) => {
            clearTimeout(timeout);
            console.log(`WS ${path}: ERROR - ${err.message}`);
            resolve();
        });
    });
}

async function main() {
    console.log('\n--- Testing HTTP endpoints ---');
    for (const p of paths) {
        await tryHttp(p);
    }
    
    console.log('\n--- Testing WebSocket endpoints ---');
    for (const p of paths) {
        await tryWs(p);
    }
    
    console.log('\nDone.');
}

main();
