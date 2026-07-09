// Quick end-to-end test: GPT analyzes sample resume text and saves to DB
require('dotenv').config();
const aiService = require('./src/services/ai.service');

const sampleResume = `
John Doe
Email: john@example.com | Phone: +91 9876543210

EDUCATION
B.Tech Computer Science, IIT Bombay, 2022, CGPA 8.5

SKILLS
JavaScript, Node.js, React, MySQL, Git, REST APIs, Python

EXPERIENCE
Software Engineer — Infosys (June 2022 – Present)
- Developed REST APIs serving 50,000+ daily users using Node.js and Express
- Reduced API latency by 40% through query optimization and Redis caching
- Led migration from monolith to microservices for 3 core modules

PROJECTS
E-Commerce Platform (React, Node.js, MySQL)
- Built full-stack marketplace with Stripe payments and JWT auth
- Achieved 99.9% uptime with Docker deployment on AWS EC2
`;

(async () => {
  console.log('Testing GPT resume analysis...\n');
  try {
    const result = await aiService.analyzeResume(sampleResume, 'gpt');
    console.log('✅ GPT raw response (first 300 chars):');
    console.log(result.substring(0, 300));

    // Check it's valid JSON
    let clean = result.trim();
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s !== -1 && e > s) clean = clean.slice(s, e + 1);
    const parsed = JSON.parse(clean);
    console.log('\n✅ Parsed successfully!');
    console.log('  atsScore:', parsed.atsScore);
    console.log('  strengths:', (parsed.strengths || []).length, 'items');
    console.log('  weaknesses:', (parsed.weaknesses || []).length, 'items');
    console.log('  jobRoles:', (parsed.jobRoles || []).length, 'items');
    console.log('  quickPractice:', (parsed.quickPractice || []).length, 'Q&As');
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  }
  console.log('\nDone.');
})();
