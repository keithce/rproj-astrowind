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
  redirectResponse, 
  classifyError, 
  createValidationErrorResponse 
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
  const verification = await checkBotId();

  if (verification.isBot) {
    console.log('BotID: Access denied');
    return jsonResponse(ApiErrors.botDetected(), 403);
  }

  const formData = await request.formData();
  try {
    const data = Object.fromEntries(formData.entries());
    const result = schema.safeParse(data);
    if (!result.success) {
      return jsonResponse(
        createValidationErrorResponse(result.error.flatten().fieldErrors),
        400
      );
    }
    const { name, email, service, message } = result.data;

    // Business logic validation (422 Unprocessable Entity)
    if (message.length > 5000) {
      return jsonResponse(
        ApiErrors.unprocessableEntity(
          'Message is too long. Please keep it under 5000 characters.',
          { field: 'message', limit: 5000, current: message.length }
        ),
        422
      );
    }

    // Additional business logic checks
    const prohibitedWords = ['spam', 'test123', 'dummy'];
    const hasProhibitedContent = prohibitedWords.some(word => 
      message.toLowerCase().includes(word) || name.toLowerCase().includes(word)
    );
    
    if (hasProhibitedContent) {
      return jsonResponse(
        ApiErrors.contentValidation('Your submission contains content that cannot be processed. Please revise and try again.'),
        422
      );
    }

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

    // --- Render the welcome email to HTML ---
    const html = await render(React.createElement(ResonantWelcomeEmail, { steps }));

    // --- Send the personalized welcome email to the user ---
    console.log('Sending welcome email to:', email);
    await resend.emails.send({
      from: 'info@rproj.art',
      to: email,
      subject: 'Welcome to Resonant Projects.art!',
      html,
    });
    console.log('Welcome email sent to:', email);

    const redirectUrl = new URL('/thank-you', request.url);
    return redirectResponse(redirectUrl.toString());
  } catch (error: unknown) {
    console.error('Error submitting to Notion:', error);
    
    // Use standardized error classification
    const { type, status, message: errorMessage } = classifyError(error);

    // Send error notification email (non-blocking)
    try {
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
    } catch (emailError) {
      console.error('Failed to send error notification email:', emailError);
    }

    // Return standardized error response
    return jsonResponse(
      {
        success: false,
        error: type,
        message: errorMessage,
        status: status,
        timestamp: new Date().toISOString()
      },
      status
    );
  }
};
