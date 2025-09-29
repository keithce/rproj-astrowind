import { config } from 'dotenv';

// Load environment variables explicitly
export function loadEnvVars() {
  // Load base .env file first
  config();

  // Load .env.development.local file if it exists (can override base values)
  config({ path: '.env.development.local', override: true });

  // Load .env.local file if it exists (highest priority, can override all previous values)
  config({ path: '.env.local', override: true });

  return {
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_RR_RESOURCES_ID: process.env.NOTION_RR_RESOURCES_ID,
  };
}

// Export the loaded environment variables
export const envVars = loadEnvVars();
