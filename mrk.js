import puppeteer from 'puppeteer-core';
import GoLogin from './src/gologin.js';
import fs from 'fs';

// Generate random waiting time within a range
function getRandomWaitTime(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NDczYjk0ZWQzNzUyMDQ5NzNmMmE0ZmUiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2NDczYmMyY2E2ZWRjYjY5NGU0ZjQyNGEifQ.pSCAZNnAQPhRJAFv3iGw4SgQmfnorhuCOLHC8EDM_PE';
const profile_ids = ['6473c71c8d5bbcdb290b0901', '6473c6d42d2a8637595bfb58'];

async function runProfile(profile_id) {
    const GL = new GoLogin({
        token,
        profile_id,
    });

    const { status, wsUrl } = await GL.start().catch((e) => {
        console.trace(e);
        return { status: 'failure' };
    });

    if (status !== 'success') {
        console.log('Invalid status');
        return;
    }

    const browser = await puppeteer.connect({
        browserWSEndpoint: wsUrl.toString(),
        ignoreHTTPSErrors: true,
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); // Disable navigation timeout

    // Load cookies
    const cookiesFilePath = `./${profile_id}_cookies.json`;
    if (fs.existsSync(cookiesFilePath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesFilePath));
        await page.setCookie(...cookies);
    }

    // Go to Google and search
    await page.goto('https://www.google.com/search?q=10kpcsoft');
    await page.waitForTimeout(20000); // Wait for the results to load

    // Click on the link
    const link = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('a')).find(el => el.href.includes('10kpcsoft.com'));
    });
    await link.click();
    await page.waitForNavigation();

    // Wait for random time
    await page.waitForTimeout(getRandomWaitTime(3000, 6000));

    // Scroll a bit
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));

    // Wait for random time
    await page.waitForTimeout(getRandomWaitTime(2000, 6000));

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Dismiss cookie notice or privacy warning
    try {
        await page.click('#accept-cookies-button'); // Replace with the selector of the accept cookies button on your target site
    } catch (error) {
        console.error('Could not find or click accept cookies button', error);
    }

    // Click on a random hyperlink
    const links = await page.$$('.entry-title a');
    const randomLink = links[Math.floor(Math.random() * links.length)];
    await randomLink.click();
    await page.waitForNavigation();
    await page.waitForTimeout(getRandomWaitTime(2000, 6000));
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    // Save cookies
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies));

    await browser.close();
    await GL.stop();
}

async function runProfiles(profile_ids) {
    for(const profile_id of profile_ids) {
        await runProfile(profile_id);
    }
    // Wait for a while before restarting the process
    setTimeout(() => runProfiles(profile_ids), 60000);
}

runProfiles(profile_ids);
