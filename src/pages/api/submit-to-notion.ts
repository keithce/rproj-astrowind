import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';
import { z } from 'astro:content';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });

const ALLOWED_SERVICES = ['Design', 'Rhythm', 'Color', 'Motion'] as const;
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  service: z.enum(ALLOWED_SERVICES),
  message: z.string().min(1, 'Message is required'),
});

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  try {
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

    // Send success email
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: 'your@email.com',
      subject: 'New Contact Form Submission',
      html: `<pre>${JSON.stringify(formData, null, 2)}</pre>`,
    });

    // Redirect to thank you page with success param
    return new Response('/thank-you', { status: 303 });
  } catch (error: unknown) {
    console.error('Error submitting to Notion:', error);
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : 'Unknown error';

    // Send error notification email
    await resend.emails.send({
      from: 'noreply@resonantprojects.art',
      to: 'info@resonantprojects.art',
      subject: 'Contact Form Error',
      html: `
        <h2>Contact Form Submission Error</h2>
        <p><strong>Error Message:</strong> ${message}</p>
        <h3>Form Data:</h3>
        <pre>${JSON.stringify(formData, null, 2)}</pre>
      `,
    });

    // Redirect to thank you page
    return new Response('/thank-you', { status: 303 });
  }
};
