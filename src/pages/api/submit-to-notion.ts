import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';
import { z } from 'astro:content';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ResonantWelcomeEmail from '~/utils/welcome-email';
import React from 'react';
import { checkBotId } from 'botid/server';
import {
  ApiErrors,
  jsonResponse,
  classifyError,
  createValidationErrorResponse,
  createSuccessResponse,
} from '../../utils/api-responses';

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
  console.log('[submit-to-notion] ⏩ Handler invoked - processing new request');
  const verification = await checkBotId();
  console.log('[submit-to-notion] 🤖 Bot verification result:', verification);

  if (verification.isBot) {
    console.log('[submit-to-notion] 🚫 Bot detected - denying access');
    // return jsonResponse(ApiErrors.botDetected(), 403);
  }

  const formData = await request.formData();
  console.log('[submit-to-notion] 📥 Raw FormData received:', Object.fromEntries(formData.entries()));
  try {
    const data = Object.fromEntries(formData.entries());
    console.log('[submit-to-notion] 🔄 Converted FormData to object:', data);
    const result = schema.safeParse(data);
    console.log('[submit-to-notion] 🛂 Schema validation success:', result.success);
    if (!result.success) {
      console.log('[submit-to-notion] ❌ Validation failed with errors:', result.error.flatten().fieldErrors);
      return jsonResponse(createValidationErrorResponse(result.error.flatten().fieldErrors), 400);
    }
    const { name, email, service, message } = result.data;
    console.log('[submit-to-notion] ✅ Parsed form fields', { name, email, service, messageLength: message.length });

    // Business logic validation (422 Unprocessable Entity)
    console.log('[submit-to-notion] 🔍 Checking message length constraint (<5000)');
    if (message.length > 5000) {
      console.log('[submit-to-notion] ⚠️ Message too long:', message.length);
      return jsonResponse(
        ApiErrors.unprocessableEntity('Message is too long. Please keep it under 5000 characters.', {
          field: 'message',
          limit: 5000,
          current: message.length,
        }),
        422
      );
    }

    // Additional business logic checks
    const prohibitedWords = ['spam', 'test123', 'dummy'];
    console.log('[submit-to-notion] 🔎 Checking for prohibited words:', prohibitedWords);

    let hasProhibitedContent = false;
    for (const word of prohibitedWords) {
      const present = message.toLowerCase().includes(word) || name.toLowerCase().includes(word);
      console.log(`  [submit-to-notion] ➡️ Word check "${word}":`, present);
      if (present) {
        hasProhibitedContent = true;
        break;
      }
    }

    if (hasProhibitedContent) {
      console.log('[submit-to-notion] 🚫 Prohibited content found in submission');
      return jsonResponse(
        ApiErrors.contentValidation(
          'Your submission contains content that cannot be processed. Please revise and try again.'
        ),
        422
      );
    }

    console.log('[submit-to-notion] 📝 Creating Notion page with submission data');
    const notionResponse = await notion.pages.create({
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
    console.log('[submit-to-notion] ✅ Notion page created', notionResponse);

    // --- Compose personalized steps for the welcome email ---
    const steps = [
      {
        id: 1,
        description: `Thank you, ${name}! I'll review your message about ${service} and respond with tailored insights or next steps.`,
      },
      {
        id: 2,
        description: `Project exploration. We'll discuss your goals, inspirations, and how Resonant Projects.art can support your vision.`,
      },
      {
        id: 3,
        description: `Resource sharing. You'll receive curated resources, ideas, and opportunities to collaborate or learn more.`,
      },
    ];
    console.log('[submit-to-notion] 📨 Welcome email steps composed', steps);

    // --- Render the welcome email to HTML ---
    console.log('[submit-to-notion] 🖨️ Rendering welcome email HTML');
    const html = await render(React.createElement(ResonantWelcomeEmail, { steps }));
    console.log('[submit-to-notion] 📄 Email HTML generated (length):', html.length);

    // --- Send the personalized welcome email to the user ---
    console.log('[submit-to-notion] ✉️ Sending welcome email to:', email);
    await resend.emails.send({
      from: 'info@rproj.art',
      to: email,
      subject: 'Welcome to Resonant Projects.art!',
      html,
    });
    console.log('[submit-to-notion] ✅ Welcome email dispatched to:', email);

    // Return JSON success response so client JS can handle redirect
    console.log('[submit-to-notion] 🚀 Preparing success JSON response');
    const redirectUrl = '/thank-you';
    const body = createSuccessResponse({ redirect: redirectUrl }, 'Form submitted successfully');
    console.log('[submit-to-notion] ↩️ Returning success response with redirect', redirectUrl);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'CDN-Cache-Control': 'max-age=10',
        'Vercel-CDN-Cache-Control': 'max-age=10',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: unknown) {
    console.error('[submit-to-notion] ❗ Error encountered during processing:', error);

    // Use standardized error classification
    const { type, status, message: errorMessage } = classifyError(error);
    console.log('[submit-to-notion] ⚠️ Classified error', { type, status, errorMessage });

    // Send error notification email (non-blocking)
    try {
      console.log('[submit-to-notion] 📧 Sending error notification email');
      await resend.emails.send({
        from: 'noreply@resonantprojects.art',
        to: 'info@resonantprojects.art',
        subject: 'Contact Form Error',
        html: `
          <h2>Contact Form Submission Error</h2>
          <p><strong>Error Type:</strong> ${type}</p>
          <p><strong>Status Code:</strong> ${status}</p>
          <p><strong>Error Message:</strong> ${errorMessage}</p>
          <h3>Form Data:</h3>
          <pre>${JSON.stringify(Object.fromEntries(formData.entries()), null, 2)}</pre>
        `,
      });
      console.log('[submit-to-notion] ✅ Error notification email sent');
    } catch (emailError) {
      console.error('[submit-to-notion] ❌ Failed to send error notification email:', emailError);
    }

    console.log('[submit-to-notion] ↩️ Returning error JSON response');
    // Return standardized error response
    return jsonResponse(
      {
        success: false,
        error: type,
        message: errorMessage,
        status: status,
        timestamp: new Date().toISOString(),
      },
      status
    );
  }
};
