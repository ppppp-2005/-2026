const automator = require('miniprogram-automator');

async function main() {
    console.log('Launching DevTools with automation...');
    console.log('CLI path: D:\\微信web开发者工具\\cli.bat');
    console.log('Project: d:\\work\\wecaht app');
    
    try {
        const mp = await automator.launch({
            cliPath: 'D:\\微信web开发者工具\\cli.bat',
            projectPath: 'd:\\work\\wecaht app',
            timeout: 60000
        });
        console.log('Connected successfully!');
        
        const page = await mp.currentPage();
        console.log('Current page:', page.path);
        
        const info = await mp.systemInfo();
        console.log('System:', JSON.stringify({
            windowWidth: info.windowWidth,
            windowHeight: info.windowHeight,
            platform: info.platform
        }));
        
        await mp.close();
        console.log('Closed.');
    } catch (e) {
        console.error('Error:', e.message);
        console.error('Stack:', e.stack);
    }
}

main();
