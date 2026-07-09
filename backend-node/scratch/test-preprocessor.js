const preprocessor = require('../src/services/chatPreprocessor');

async function runTests() {
  const tests = [
    { text: 'what is your name', expected: 'About Bot' },
    { text: "what's your name", expected: 'About Bot' },
    { text: 'who are you', expected: 'About Bot' },
    { text: 'how are you', expected: 'Small Talk' },
    { text: 'how do you change password', expected: 'profile' },
    { text: 'what services your offers', expected: 'platform_overview' },
    { text: 'what are the features', expected: 'platform_overview' }
  ];

  console.log('🧪 Starting Preprocessor Intent matching tests...');
  for (const test of tests) {
    const res = await preprocessor.processMessage({
      message: test.text,
      mode: 'chat',
      isAuthenticated: true
    });
    const got = res.classification || (res.matchedFaq ? `Intent:${res.matchedFaq}` : 'Unknown');
    const ok = got.toLowerCase().includes(test.expected.toLowerCase());
    console.log(`- Query: "${test.text}" | Expected: "${test.expected}" | Got: "${got}" | Result: ${ok ? '✅ PASS' : '❌ FAIL'}`);
    if (!ok) {
      console.log('  Reply text:', res.reply);
    }
  }
}

runTests().catch(console.error);
