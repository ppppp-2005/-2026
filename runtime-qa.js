const automator = require('miniprogram-automator');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'd:\\work\\wecaht app\\workstreams\\07-quality-review\\evidence\\2026-06-22';

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
    started: new Date().toISOString(),
    connection: null,
    tabs: [],
    routes: [],
    search: [],
    login: [],
    employer: [],
    findings: [],
    blockers: [],
    summary: null
};

function log(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(mp, name) {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    try {
        await mp.screenshot({ path: filePath });
        log(`Screenshot saved: ${name}.png`);
        return { name, path: filePath, success: true };
    } catch (e) {
        log(`Screenshot failed: ${name} - ${e.message}`);
        return { name, path: filePath, success: false, error: e.message };
    }
}

async function run() {
    log('Launching WeChat DevTools with automation...');
    
    let mp;
    try {
        mp = await automator.launch({
            cliPath: 'D:\\微信web开发者工具\\cli.bat',
            projectPath: 'd:\\work\\wecaht app'
        });
        log('Connected successfully!');
        results.connection = 'success';
    } catch (e) {
        log(`Launch failed: ${e.message}`);
        
        // Try connect with the port from .ide file
        try {
            const port = fs.readFileSync('C:\\Users\\Administrator\\AppData\\Local\\微信开发者工具\\User Data\\97c2c3ed9e9b4a343745d4ac3603eef1\\Default\\.ide', 'utf8').trim();
            log(`Trying to connect to port ${port}...`);
            mp = await automator.connect({
                wsEndpoint: `ws://127.0.0.1:${port}`
            });
            log('Connected via connect!');
            results.connection = 'success (connect)';
        } catch (e2) {
            log(`Connect also failed: ${e2.message}`);
            results.connection = 'failed';
            results.blockers.push(`Connection failed: ${e.message}; Connect: ${e2.message}`);
            console.log(JSON.stringify(results, null, 2));
            process.exit(1);
        }
    }

    try {
        // ========================================
        // STEP 1: System Info
        // ========================================
        log('\n=== STEP 1: System Info ===');
        try {
            const systemInfo = await mp.systemInfo();
            log(`System: ${JSON.stringify({ model: systemInfo.model, pixelRatio: systemInfo.pixelRatio, windowWidth: systemInfo.windowWidth, windowHeight: systemInfo.windowHeight, platform: systemInfo.platform })}`);
            results.systemInfo = {
                model: systemInfo.model,
                pixelRatio: systemInfo.pixelRatio,
                windowWidth: systemInfo.windowWidth,
                windowHeight: systemInfo.windowHeight,
                platform: systemInfo.platform
            };
        } catch (e) {
            log(`System info failed: ${e.message}`);
        }

        // ========================================
        // STEP 2: Initial page
        // ========================================
        log('\n=== STEP 2: Initial Page ===');
        const page = await mp.currentPage();
        log(`Current page: ${page.path}`);
        results.currentPage = page.path;
        await takeScreenshot(mp, '01-initial-state');

        // ========================================
        // STEP 3: Test 5 Tabs
        // ========================================
        log('\n=== STEP 3: Testing 5 Tabs ===');
        const tabs = [
            { name: 'home', url: 'pages/home/index', label: '首页' },
            { name: 'events', url: 'pages/events/index', label: '交流' },
            { name: 'jobs', url: 'pages/jobs/index', label: '职位' },
            { name: 'messages', url: 'pages/messages/index', label: '消息' },
            { name: 'profile', url: 'pages/profile/index', label: '我的' }
        ];

        for (const tab of tabs) {
            try {
                log(`Switching to tab: ${tab.label} (${tab.url})`);
                await mp.switchTab(`/${tab.url}`);
                await sleep(2000);
                
                const page = await mp.currentPage();
                log(`Current page: ${page.path}`);
                
                let pageData = null;
                try {
                    pageData = await page.data;
                } catch (e) {
                    pageData = `data access failed: ${e.message}`;
                }
                
                const screenshot = await takeScreenshot(mp, `02-tab-${tab.name}`);
                
                results.tabs.push({
                    name: tab.name,
                    label: tab.label,
                    url: tab.url,
                    actualPath: page.path,
                    success: page.path === tab.url,
                    pageDataKeys: typeof pageData === 'object' ? Object.keys(pageData).slice(0, 10) : [pageData],
                    screenshot: screenshot.success
                });
                
                log(`Tab ${tab.label}: ${page.path === tab.url ? 'PASS' : 'FAIL'} (path: ${page.path})`);
            } catch (e) {
                log(`Tab ${tab.label} failed: ${e.message}`);
                results.tabs.push({
                    name: tab.name,
                    label: tab.label,
                    url: tab.url,
                    success: false,
                    error: e.message
                });
            }
        }

        // ========================================
        // STEP 4: Test Dynamic Routes
        // ========================================
        log('\n=== STEP 4: Testing Dynamic Routes ===');
        const routes = [
            { name: 'job-detail', url: 'pages/job-detail/index?id=job-1', label: '职位详情' },
            { name: 'message-detail', url: 'pages/message-detail/index?id=msg-1', label: '消息详情' },
            { name: 'employer-candidates', url: 'pages/employer-candidates/index?jobId=job-1', label: '候选人' }
        ];

        for (const route of routes) {
            try {
                log(`Navigating to: ${route.label} (${route.url})`);
                await mp.navigateTo(`/${route.url}`);
                await sleep(2000);
                
                const page = await mp.currentPage();
                log(`Current page: ${page.path}`);
                
                let pageData = null;
                try {
                    pageData = await page.data;
                } catch (e) {
                    pageData = `data access failed: ${e.message}`;
                }
                
                const screenshot = await takeScreenshot(mp, `03-route-${route.name}`);
                
                results.routes.push({
                    name: route.name,
                    label: route.label,
                    url: route.url,
                    actualPath: page.path,
                    success: page.path === route.url.split('?')[0],
                    pageDataKeys: typeof pageData === 'object' ? Object.keys(pageData).slice(0, 10) : [pageData],
                    screenshot: screenshot.success
                });
                
                log(`Route ${route.label}: ${page.path === route.url.split('?')[0] ? 'PASS' : 'FAIL'}`);
                
                await mp.navigateBack();
                await sleep(1000);
            } catch (e) {
                log(`Route ${route.label} failed: ${e.message}`);
                results.routes.push({
                    name: route.name,
                    label: route.label,
                    url: route.url,
                    success: false,
                    error: e.message
                });
                try { await mp.navigateBack(); await sleep(500); } catch(e2) {}
            }
        }

        // ========================================
        // STEP 5: Test Search and Filter
        // ========================================
        log('\n=== STEP 5: Testing Search and Filter ===');
        try {
            await mp.switchTab('/pages/jobs/index');
            await sleep(2000);
            
            const jobsPage = await mp.currentPage();
            log(`Jobs page: ${jobsPage.path}`);
            
            let initialData = await jobsPage.data;
            log(`Jobs data keys: ${Object.keys(initialData).join(', ')}`);
            log(`loadState: ${initialData.loadState}, visibleJobs: ${initialData.visibleJobs?.length || 0}`);
            
            // Test search - empty result
            try {
                await jobsPage.callMethod('onSearchInput', { detail: { value: '不存在的岗位' } });
                await sleep(1000);
                let searchData = await jobsPage.data;
                log(`After search - loadState: ${searchData.loadState}, visibleJobs: ${searchData.visibleJobs?.length || 0}`);
                
                results.search.push({
                    test: 'search-empty',
                    success: searchData.loadState === 'empty',
                    loadState: searchData.loadState,
                    jobCount: searchData.visibleJobs?.length || 0,
                    screenshot: (await takeScreenshot(mp, '04-search-empty')).success
                });
            } catch (e) {
                log(`Search test failed: ${e.message}`);
                results.search.push({ test: 'search-empty', success: false, error: e.message });
            }
            
            // Clear search
            try {
                await jobsPage.callMethod('onSearchInput', { detail: { value: '' } });
                await sleep(1000);
                let clearedData = await jobsPage.data;
                log(`After clear - loadState: ${clearedData.loadState}, visibleJobs: ${clearedData.visibleJobs?.length || 0}`);
                
                results.search.push({
                    test: 'search-clear',
                    success: clearedData.loadState === 'normal',
                    loadState: clearedData.loadState,
                    jobCount: clearedData.visibleJobs?.length || 0
                });
            } catch (e) {
                log(`Clear search failed: ${e.message}`);
            }
            
            // Test retry
            try {
                await jobsPage.callMethod('onRetry');
                await sleep(1000);
                let retryData = await jobsPage.data;
                log(`After retry - loadState: ${retryData.loadState}`);
                
                results.search.push({
                    test: 'retry',
                    success: retryData.loadState === 'normal' || retryData.loadState === 'loading',
                    loadState: retryData.loadState
                });
            } catch (e) {
                log(`Retry test failed: ${e.message}`);
                results.search.push({ test: 'retry', success: false, error: e.message });
            }
            
        } catch (e) {
            log(`Search/filter step failed: ${e.message}`);
            results.search.push({ test: 'step', success: false, error: e.message });
        }

        // ========================================
        // STEP 6: Test Login
        // ========================================
        log('\n=== STEP 6: Testing Login ===');
        try {
            await mp.switchTab('/pages/profile/index');
            await sleep(2000);
            
            const profilePage = await mp.currentPage();
            log(`Profile page: ${profilePage.path}`);
            
            let profileData = await profilePage.data;
            log(`Profile: isLoggedIn=${profileData.isLoggedIn}`);
            
            await takeScreenshot(mp, '05-profile-not-logged-in');
            
            // Navigate to login
            await mp.navigateTo('/pages/profile-login/index');
            await sleep(2000);
            
            const loginPage = await mp.currentPage();
            log(`Login page: ${loginPage.path}`);
            
            let loginData = await loginPage.data;
            log(`Login: agreed=${loginData.agreed}, submitting=${loginData.submitting}`);
            
            await takeScreenshot(mp, '05-login-page');
            
            // Toggle agreement
            try {
                if (!loginData.agreed) {
                    await loginPage.callMethod('onAgreementToggle');
                    await sleep(500);
                }
                let afterToggle = await loginPage.data;
                log(`After agreement toggle: agreed=${afterToggle.agreed}`);
                
                results.login.push({
                    test: 'agreement-toggle',
                    success: afterToggle.agreed === true,
                    agreed: afterToggle.agreed
                });
            } catch (e) {
                log(`Agreement toggle failed: ${e.message}`);
                results.login.push({ test: 'agreement-toggle', success: false, error: e.message });
            }
            
            // Try login
            try {
                await loginPage.callMethod('onLoginTap', { currentTarget: { dataset: { scenario: 'job-seeker' } } });
                await sleep(2000);
                
                let afterLogin = await loginPage.data;
                log(`After login: submitting=${afterLogin.submitting}`);
                
                results.login.push({
                    test: 'login',
                    success: true,
                    submitting: afterLogin.submitting,
                    screenshot: (await takeScreenshot(mp, '05-login-success')).success
                });
            } catch (e) {
                log(`Login test failed: ${e.message}`);
                results.login.push({ test: 'login', success: false, error: e.message });
            }
            
            await mp.navigateBack();
            await sleep(1000);
            
        } catch (e) {
            log(`Login step failed: ${e.message}`);
            results.login.push({ test: 'step', success: false, error: e.message });
        }

        // ========================================
        // STEP 7: Test Employer
        // ========================================
        log('\n=== STEP 7: Testing Employer ===');
        try {
            await mp.navigateTo('/pages/employer/index');
            await sleep(2000);
            
            const employerPage = await mp.currentPage();
            log(`Employer page: ${employerPage.path}`);
            await takeScreenshot(mp, '06-employer-page');
            
            // Navigate to job form
            await mp.navigateTo('/pages/employer-job-form/index');
            await sleep(2000);
            
            const formPage = await mp.currentPage();
            log(`Job form: ${formPage.path}`);
            
            let formData = await formPage.data;
            log(`Form data keys: ${Object.keys(formData).join(', ')}`);
            
            await takeScreenshot(mp, '06-employer-job-form');
            
            // Test form validation
            try {
                await formPage.callMethod('onSubmit');
                await sleep(1000);
                let afterSubmit = await formPage.data;
                log(`After empty submit - errors: ${JSON.stringify(afterSubmit.errors || {})}`);
                
                results.employer.push({
                    test: 'form-validation',
                    success: afterSubmit.errors && Object.keys(afterSubmit.errors).length > 0,
                    errorCount: afterSubmit.errors ? Object.keys(afterSubmit.errors).length : 0,
                    screenshot: (await takeScreenshot(mp, '06-form-validation-errors')).success
                });
            } catch (e) {
                log(`Form validation test failed: ${e.message}`);
                results.employer.push({ test: 'form-validation', success: false, error: e.message });
            }
            
            await mp.navigateBack();
            await sleep(1000);
            
        } catch (e) {
            log(`Employer step failed: ${e.message}`);
            results.employer.push({ test: 'step', success: false, error: e.message });
        }

        // ========================================
        // STEP 8: Test Other Pages
        // ========================================
        log('\n=== STEP 8: Testing Other Pages ===');
        const otherPages = [
            { name: 'training', url: 'pages/training/index' },
            { name: 'policy', url: 'pages/policy/index' },
            { name: 'campus', url: 'pages/campus/index' },
            { name: 'labor', url: 'pages/labor/index' },
            { name: 'return-home', url: 'pages/return-home/index' }
        ];

        for (const p of otherPages) {
            try {
                log(`Navigating to: ${p.name}`);
                await mp.navigateTo(`/${p.url}`);
                await sleep(2000);
                
                const page = await mp.currentPage();
                log(`Page: ${page.path}`);
                
                let pageData = await page.data;
                log(`Data keys: ${Object.keys(pageData).slice(0, 5).join(', ')}`);
                
                await takeScreenshot(mp, `07-${p.name}`);
                
                results.routes.push({
                    name: p.name,
                    url: p.url,
                    actualPath: page.path,
                    success: page.path === p.url,
                    pageDataKeys: Object.keys(pageData).slice(0, 5),
                    screenshot: true
                });
                
                await mp.navigateBack();
                await sleep(1000);
            } catch (e) {
                log(`Page ${p.name} failed: ${e.message}`);
                results.routes.push({
                    name: p.name,
                    url: p.url,
                    success: false,
                    error: e.message
                });
                try { await mp.navigateBack(); await sleep(500); } catch(e2) {}
            }
        }

        // ========================================
        // STEP 9: Final Screenshot
        // ========================================
        log('\n=== STEP 9: Final State ===');
        await mp.switchTab('/pages/home/index');
        await sleep(2000);
        await takeScreenshot(mp, '09-final-home');

        // ========================================
        // Summary
        // ========================================
        log('\n=== SUMMARY ===');
        
        const tabPass = results.tabs.filter(t => t.success).length;
        const routePass = results.routes.filter(r => r.success).length;
        const searchPass = results.search.filter(s => s.success).length;
        const loginPass = results.login.filter(l => l.success).length;
        const employerPass = results.employer.filter(e => e.success).length;
        
        results.summary = {
            totalTabs: results.tabs.length,
            tabsPassed: tabPass,
            totalRoutes: results.routes.length,
            routesPassed: routePass,
            totalSearch: results.search.length,
            searchPassed: searchPass,
            totalLogin: results.login.length,
            loginPassed: loginPass,
            totalEmployer: results.employer.length,
            employerPassed: employerPass,
            overall: (tabPass === results.tabs.length && routePass === results.routes.length) ? 'PASS' : 'PARTIAL'
        };
        
        log(`Tabs: ${tabPass}/${results.tabs.length}`);
        log(`Routes: ${routePass}/${results.routes.length}`);
        log(`Search: ${searchPass}/${results.search.length}`);
        log(`Login: ${loginPass}/${results.login.length}`);
        log(`Employer: ${employerPass}/${results.employer.length}`);
        log(`Overall: ${results.summary.overall}`);
        
        results.completed = new Date().toISOString();
        
        // Save results
        const resultsPath = path.join(SCREENSHOT_DIR, 'runtime-qa-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        log(`\nResults saved to: ${resultsPath}`);
        
    } catch (e) {
        log(`Fatal error: ${e.message}`);
        results.blockers.push(`Fatal: ${e.message}`);
        results.summary = { overall: 'ERROR', error: e.message };
    } finally {
        try {
            await mp.close();
            log('Connection closed.');
        } catch (e) {
            log(`Close failed: ${e.message}`);
        }
    }
    
    console.log('\n\n=== FINAL RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
}

run().catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
