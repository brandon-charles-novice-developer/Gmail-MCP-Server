#!/usr/bin/env node

/**
 * Gmail-MCP-Server Configuration Verification
 * Verifies API keys and LLM configuration
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Gmail-MCP-Server Configuration Verification\n');

// Check LLM Provider Configuration
const checks = [
  {
    name: 'LLM Provider',
    value: process.env.LLM_PROVIDER,
    expected: 'anthropic',
  },
  {
    name: 'LLM Model',
    value: process.env.LLM_MODEL,
    expected: 'claude-sonnet-4-5',
  },
  {
    name: 'Economy Provider',
    value: process.env.ECONOMY_LLM_PROVIDER,
    expected: 'anthropic',
  },
  {
    name: 'Economy Model',
    value: process.env.ECONOMY_LLM_MODEL,
    expected: 'claude-haiku-4-5',
  },
  {
    name: 'Anthropic API Key',
    value: process.env.ANTHROPIC_API_KEY,
    validate: (val) => val && val.startsWith('sk-ant-api03-') && val.length > 50,
  },
];

let allPassed = true;

checks.forEach((check) => {
  const isValid = check.validate
    ? check.validate(check.value)
    : check.value === check.expected;

  const status = isValid ? '✅' : '❌';
  const displayValue = check.name.includes('API Key') && check.value
    ? `${check.value.substring(0, 20)}...`
    : check.value || '(not set)';

  console.log(`${status} ${check.name}: ${displayValue}`);

  if (!isValid) allPassed = false;
});

// Check optional settings
console.log('\n📊 Optional Settings:');
console.log(`   Cache TTL: ${process.env.CATEGORIZATION_CACHE_TTL || '3600'} seconds`);
console.log(`   Cache Cold Senders: ${process.env.CACHE_COLD_SENDERS || 'true'}`);
console.log(`   Max Batch Size: ${process.env.MAX_BATCH_SIZE || '50'} emails`);
console.log(`   Token Logging: ${process.env.LOG_TOKEN_USAGE || 'true'}`);
console.log(`   Debug LLM Calls: ${process.env.DEBUG_LLM_CALLS || 'false'}`);

// Cost estimation
console.log('\n💰 Expected Costs (per 100 emails):');
console.log('   Categorization (Haiku): ~$0.05');
console.log('   Context Extraction (Sonnet, 20 emails): ~$0.04');
console.log('   Cold Detection (Haiku): ~$0.03');
console.log('   Total: ~$0.12 (reduces to ~$0.08 with caching)');

console.log('\n' + (allPassed ? '🎉 Configuration is complete and valid!' : '⚠️  Some configuration issues detected. Please review above.'));
console.log('\n📚 Next Steps:');
console.log('   1. Start the MCP server: npm start');
console.log('   2. Test AI tools via MCP client (Claude Desktop, Claude Code)');
console.log('   3. Monitor token usage in console logs');
console.log('   4. See SETUP-AI.md for troubleshooting');

process.exit(allPassed ? 0 : 1);
