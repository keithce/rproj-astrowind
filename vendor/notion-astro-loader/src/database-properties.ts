import type { Client } from '@notionhq/client';
import { z } from 'astro/zod';
import * as rawPropertyType from './schemas/raw-properties.js';
import type { DatabasePropertyConfigResponse } from './types.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function propertiesSchemaForDatabase(client: Client, databaseId: string) {
  // Retry with exponential backoff to withstand transient Notion rate limits
  let attempts = 0;
  let lastError: unknown;
  let database: any = null;
  while (attempts < 6) {
    try {
      database = await client.databases.retrieve({ database_id: databaseId });
      break;
    } catch (e: any) {
      lastError = e;
      const msg = String(e?.message || e);
      if (e?.code === 'rate_limited' || msg.toLowerCase().includes('rate limited')) {
        const wait = Math.min(1000 * Math.pow(2, attempts), 15000);
        await sleep(wait);
        attempts++;
        continue;
      }
      throw e;
    }
  }
  if (!database) {
    // As a last resort, return an open schema so downstream can continue; logs will show the rate limit
    return z.object({});
  }

  const schemaForDatabaseProperty: (propertyConfig: DatabasePropertyConfigResponse) => z.ZodTypeAny = (
    propertyConfig
  ) => rawPropertyType[propertyConfig.type];

  const schema = Object.fromEntries(
    Object.entries(database.properties).map(([key, value]) => {
      const typedValue = value as DatabasePropertyConfigResponse;
      let propertySchema = schemaForDatabaseProperty(typedValue);
      if (typedValue.description) {
        propertySchema = propertySchema.describe(typedValue.description);
      }
      if (key !== 'Name') {
        // propertySchema = propertySchema.optional();
      }

      return [key, propertySchema];
    })
  );

  return z.object(schema);
}
