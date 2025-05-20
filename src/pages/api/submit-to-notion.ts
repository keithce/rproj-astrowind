import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';
import { z } from 'astro:content';

export const config = { runtime: 'edge' };

const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });

const ALLOWED_SERVICES = ['Design', 'Rhythm', 'Color', 'Motion'] as const;
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  service: z.enum(ALLOWED_SERVICES),
  message: z.string().min(1, 'Message is required'),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const result = schema.safeParse(data);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: result.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { name, email, service, message } = result.data;

    await notion.pages.create({
      parent: { database_id: import.meta.env.NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [{ text: { content: name } }],
        },
        Email: { email },
        Service: {
          select: { name: service },
        },
        Message: {
          rich_text: [{ text: { content: message } }],
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Form data successfully submitted to Notion',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error submitting to Notion:', error);
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Submission failed',
        error: message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
