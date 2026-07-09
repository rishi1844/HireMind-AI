const jwt = require('jsonwebtoken');
const { generatePdfBuffer } = require('../src/services/resumePuppeteer.service');
require('dotenv').config();

async function run() {
  const resumeId = '18'; // Using resumeId 18 which was in the logs
  const token = jwt.sign(
    { resumeId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '5m' }
  );

  console.log('Generating PDF for resume ID 18...');
  try {
    const pdfBuffer = await generatePdfBuffer(resumeId, token);
    console.log(`Success! PDF generated successfully: ${pdfBuffer.length} bytes`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

run();
