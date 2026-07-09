const path = require('path');
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  try {
    puppeteer = require('puppeteer-core');
  } catch (err) {
    throw new Error('Puppeteer is not installed. Please run "npm install puppeteer" or "npm install puppeteer-core".');
  }
}
const logger = require('../utils/logger');

/**
 * Launch Puppeteer, navigate to the resume print page, wait for rendering, and export as A4 PDF buffer.
 *
 * @param {string|number} resumeId The ID of the resume to export
 * @param {string} token Short-lived signed token containing resume data
 * @returns {Promise<Buffer>} The generated PDF buffer
 */
async function generatePdfBuffer(resumeId, token) {
  const frontendUrlString = process.env.PUPPETEER_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  // If comma-separated (e.g. localhost + prod domain), take the first one
  const frontendUrl = frontendUrlString.split(',')[0].trim();
  const printUrl = `${frontendUrl}/resume/print/${resumeId}?token=${encodeURIComponent(token)}`;

  logger.info(`Puppeteer starting PDF generation for resumeId=${resumeId} via ${printUrl}`);

  let browser;
  let page;
  try {
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--font-render-hinting=none', // Ensure clean text rendering
    ];

    // --single-process is only safe on Linux/Docker environments; it causes crashes on Windows.
    if (process.platform !== 'win32') {
      launchArgs.push('--single-process');
    }

    const launchOptions = {
      headless: 'new',
      args: launchArgs
    };

    // If custom Chromium/Chrome path is specified (e.g., in serverless/Vercel/Docker envs)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      logger.info(`Puppeteer using custom executable path: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    // Set standard viewport for A4 at 96 DPI (794 x 1123) with high scale factor for vector-like clarity
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    // Step 1: page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    logger.info(`Puppeteer: Step 1 - navigating to print URL...`);
    await page.goto(printUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // --- DEBUGGING LOGS: Page title and content length ---
    const pageTitle = await page.title();
    logger.info(`Puppeteer: Page title after load: "${pageTitle}"`);

    // Step 2: page.waitForSelector('#resume-print', { visible: true, timeout: 15000 })
    logger.info('Puppeteer: Step 2 - waiting for #resume-print to render...');
    await page.waitForSelector('#resume-print', { visible: true, timeout: 15000 });

    // 2a. Error guard: if the error panel is visible, token validation failed — abort early.
    const hasError = await page.evaluate(() => {
      const el = document.getElementById('resume-error');
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    if (hasError) {
      const errorText = await page.$eval('#resume-error', el => el.textContent || '').catch(() => 'unknown error');
      throw new Error(`Print page rendered an error state: ${errorText.trim()}`);
    }

    // Step 3: page.waitForSelector('#resume-loading', { hidden: true, timeout: 15000 })
    logger.info('Puppeteer: Step 3 - waiting for #resume-loading to be hidden...');
    await page.waitForSelector('#resume-loading', { hidden: true, timeout: 15000 }).catch(() => {
      logger.info('Puppeteer: #resume-loading element not found or already hidden.');
    });

    // Step 4: page.evaluate(() => await document.fonts.ready)
    logger.info('Puppeteer: Step 4 - waiting for fonts to load...');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // Step 5: page.evaluate() → wait for all images
    logger.info('Puppeteer: Step 5 - waiting for all images to load...');
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve); // Resolve on error too to prevent blocking forever
        });
      }));
    });

    // Step 6: setTimeout fallback 1500ms
    const fallbackMs = parseInt(process.env.PUPPETEER_WAIT_MS, 10) || 1500;
    logger.info(`Puppeteer: Step 6 - performing fallback sleep of ${fallbackMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, fallbackMs));

    // Step 7: page.evaluate() → ONLY remove <script> tags — DO NOT touch body, DO NOT clear innerHTML, DO NOT remove #resume-print or its parents
    logger.info('Puppeteer: Step 7 - removing <script> tags from DOM...');
    await page.evaluate(() => {
      document.querySelectorAll('script').forEach(el => el.remove());
    });

    // Step 8: Check #resume-print exists and has content:
    logger.info('Puppeteer: Step 8 - verifying #resume-print content...');
    const content = await page.$eval('#resume-print', el => el.innerHTML.length);
    if (content < 100) {
      throw new Error('resume-print is empty — blank PDF would be generated');
    }

    // Step 9: page.emulateMediaType('print')  ← ONLY NOW emulate print
    logger.info('Puppeteer: Step 9 - emulating print media...');
    await page.emulateMediaType('print');

    // Step 10: page.screenshot({ fullPage: true }) for debugging
    const screenshotPath = path.join(__dirname, '../../debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.info(`Puppeteer: Step 10 - saved debug screenshot to ${screenshotPath}`);

    // Step 11: page.pdf({ format: 'A4', printBackground: true, ... })
    logger.info('Puppeteer: Step 11 - exporting PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true, // Uses the @page rules defined in PrintCanvas
      scale: 1,                // No zoom scaling to preserve layout size
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    // --- DEBUGGING: Check size of the generated PDF buffer ---
    logger.info(`Puppeteer: Successfully generated PDF buffer (${pdfBuffer.length} bytes)`);
    if (pdfBuffer.length < 10240) { // 10 KB
      logger.warn(`Puppeteer WARNING: Generated PDF is extremely small (${pdfBuffer.length} bytes). Something might be wrong.`);
    }

    return pdfBuffer;
  } catch (error) {
    logger.error(`Puppeteer failed to generate PDF for resumeId=${resumeId}: ${error.stack || error.message}`);
    if (page) {
      try {
        const errorScreenshotPath = path.join(__dirname, '../../debug_error.png');
        await page.screenshot({ path: errorScreenshotPath, fullPage: true });
        logger.info(`Puppeteer: Saved error state screenshot to ${errorScreenshotPath}`);
      } catch (screenshotError) {
        logger.error(`Puppeteer failed to take error screenshot: ${screenshotError.message}`);
      }
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      logger.info('Puppeteer: Browser closed.');
    }
  }
}

module.exports = {
  generatePdfBuffer
};
