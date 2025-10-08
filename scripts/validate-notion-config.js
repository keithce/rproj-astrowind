#!/usr/bin/env node

/**
 * Notion Configuration Validator
 *
 * This script validates that the Notion environment variables are properly set
 * and can be used to connect to the Notion API.
 */

import { config } from 'dotenv';
import { Client } from '@notionhq/client';

// Load environment variables
config();

const notionToken = process.env.NOTION_TOKEN;
const notionDatabaseId = process.env.NOTION_RR_RESOURCES_ID;

console.log('🔍 Validating Notion Configuration...\n');

// Check if environment variables are set
if (!notionToken) {
  console.error('❌ NOTION_TOKEN is not set');
  console.error('   Please set NOTION_TOKEN in your .env file');
  process.exit(1);
}

if (!notionDatabaseId) {
  console.error('❌ NOTION_RR_RESOURCES_ID is not set');
  console.error('   Please set NOTION_RR_RESOURCES_ID in your .env file');
  process.exit(1);
}

console.log('✅ Environment variables are set');
console.log(`   NOTION_TOKEN length: ${notionToken.length}`);
console.log(`   NOTION_RR_RESOURCES_ID: ${notionDatabaseId}`);

// Validate Notion token format
if (!notionToken.startsWith('secret_')) {
  console.warn('⚠️  NOTION_TOKEN does not start with "secret_" - this might be incorrect');
}

// Validate database ID format (should be a UUID)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(notionDatabaseId)) {
  console.warn('⚠️  NOTION_RR_RESOURCES_ID does not look like a valid UUID');
}

// Test Notion API connection
console.log('\n🔌 Testing Notion API connection...');

try {
  const notion = new Client({
    auth: notionToken,
  });

  // Try to retrieve database information
  const response = await notion.databases.retrieve({
    database_id: notionDatabaseId,
  });

  console.log('✅ Successfully connected to Notion API');
  console.log(`   Database title: ${response.title[0]?.plain_text || 'Untitled'}`);
  console.log(`   Database ID: ${response.id}`);

  // Try to query the database
  const queryResponse = await notion.databases.query({
    database_id: notionDatabaseId,
    page_size: 1,
  });

  console.log(`   Total pages: ${queryResponse.results.length} (showing first page only)`);

  if (queryResponse.results.length > 0) {
    const firstPage = queryResponse.results[0];
    console.log(`   First page ID: ${firstPage.id}`);
  }

  console.log('\n🎉 Notion configuration is valid!');
} catch (error) {
  console.error('❌ Failed to connect to Notion API');
  console.error(`   Error: ${error.message}`);

  if (error.code === 'invalid_request_url') {
    console.error('\n💡 This error usually means:');
    console.error('   - The NOTION_RR_RESOURCES_ID is not a valid database ID');
    console.error('   - The database ID format is incorrect');
    console.error('   - The database does not exist or is not accessible');
  } else if (error.code === 'unauthorized') {
    console.error('\n💡 This error usually means:');
    console.error('   - The NOTION_TOKEN is invalid or expired');
    console.error('   - The integration does not have access to the database');
    console.error('   - The integration needs to be shared with the database');
  }

  process.exit(1);
}
