import { config } from 'dotenv';

// Load environment variables explicitly
export function loadEnvVars() {
  // Load .env file
  config();

  // Load .env.development.local file if it exists
  config({ path: '.env.development.local' });

  // Load .env.local file if it exists
  config({ path: '.env.local' });

  return {
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_RR_RESOURCES_ID: process.env.NOTION_RR_RESOURCES_ID,
  };
}

// Export the loaded environment variables
export const envVars = loadEnvVars();
