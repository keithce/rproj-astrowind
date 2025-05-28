import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import React from 'react';

interface ResonantWelcomeEmailProps {
  steps: {
    id: number;
    description: string;
  }[];
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

export const ResonantWelcomeEmail = ({ steps }: ResonantWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                primary: '#6e2765',
                secondary: '#42173d',
                accent: '#c5a9c1',
                heading: '#160814',
                text: '#2c1028',
                muted: 'rgb(16 16 16 / 66%)',
                bg: '#f1e9f0',
                white: '#fff',
              },
              fontFamily: {
                sans: ['Raleway Variable', 'sans-serif'],
              },
              spacing: {
                0: '0px',
                20: '20px',
                45: '45px',
              },
            },
          },
        }}
      >
        <Preview>Welcome to Resonant Projects.art</Preview>
        <Body className="bg-bg font-sans text-base">
          <Img
            src={`${baseUrl}/images/Logo.png`}
            width="120"
            height="120"
            alt="Resonant Projects Logo"
            className="mx-auto my-20"
            style={{ borderRadius: '12px' }}
          />
          <Container className="bg-white p-45 rounded-lg shadow-md">
            <Heading className="my-0 text-center leading-8 text-primary font-bold text-2xl">
              Welcome to Resonant Projects.art
            </Heading>

            <Section>
              <Row>
                <Text className="text-base text-text text-center mt-4">
                  Thank you for reaching out to Resonant Projects.art!
                  <br />
                  We're excited to connect and help you awaken the sound of emotion in your creative journey.
                </Text>
                <Text className="text-base text-text text-center mt-4">
                  Here's what you can expect in our follow-up:
                </Text>
              </Row>
            </Section>

            <ul className="mt-4 mb-8 list-disc list-inside text-text">
              {steps?.map(({ id, description }) => (
                <li className="mb-20" key={id}>
                  {description}
                </li>
              ))}
            </ul>

            <Section className="text-center mt-8">
              <Button
                className="rounded-lg bg-primary px-[18px] py-3 text-white font-semibold hover:bg-secondary transition-colors"
                href="https://cal.com/resonantprojects/30min"
              >
                Book a 30-Minute Call
              </Button>
            </Section>

            <Section className="text-center mt-6">
              <Text className="text-base text-text">
                Want to follow my journey?&nbsp;
                <Link href="https://newsletter.resonantprojects.art/" className="text-accent underline font-medium">
                  Sign up for the Resonant Projects newsletter
                </Link>
                .
              </Text>
            </Section>
          </Container>

          <Container className="mt-20">
            <Section>
              <Row>
                <Column className="px-20 text-right">
                  <Link className="text-muted underline">Unsubscribe</Link>
                </Column>
                <Column className="text-left">
                  <Link className="text-muted underline">Manage Preferences</Link>
                </Column>
              </Row>
            </Section>
            <Text className="mb-45 text-center text-muted text-xs">Resonant Projects.art</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ResonantWelcomeEmail.PreviewProps = {
  steps: [
    {
      id: 1,
      description: "Personalized follow-up. I'll review your message and respond with tailored insights or next steps.",
    },
    {
      id: 2,
      description:
        "Project exploration. We'll discuss your goals, inspirations, and how Resonant Projects.art can support your vision.",
    },
    {
      id: 3,
      description:
        "Resource sharing. You'll receive curated resources, ideas, and opportunities to collaborate or learn more.",
    },
  ],
} satisfies ResonantWelcomeEmailProps;

export default ResonantWelcomeEmail;
