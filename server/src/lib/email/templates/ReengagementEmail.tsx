import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
  Tailwind,
  pixelBasedPreset,
} from "@react-email/components";
import * as React from "react";

interface ReengagementEmailProps {
  userName: string;
  day: number;
  title: string;
  message: string;
  ctaText: string;
  ctaLink: string;
  unsubscribeUrl: string;
}

export const ReengagementEmail = ({
  userName,
  day,
  title,
  message,
  ctaText,
  ctaLink,
  unsubscribeUrl,
}: ReengagementEmailProps) => {
  const greeting = userName ? `Hi ${userName}` : "Hi there";

  // Split message into paragraphs
  const paragraphs = message.split("\n\n").filter(p => p.trim());

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: "#10b981",
                darkText: "#111827",
                mutedText: "#6b7280",
                borderColor: "#e5e7eb",
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-8 px-6 max-w-[600px]">
            <Img src="https://app.rybbit.io/rybbit-text-black.png" alt="Rybbit" width="100" height="28" className="mb-8" />

            <Text className="text-darkText text-base leading-relaxed mb-4">{greeting},</Text>

            {paragraphs.map((paragraph, index) => (
              <Text key={index} className="text-darkText text-base leading-relaxed mb-4">
                {paragraph}
              </Text>
            ))}

            <Text className="text-darkText text-base leading-relaxed mb-4">
              <Link href={ctaLink} className="text-brand underline">
                {ctaText}
              </Link>
            </Text>

            <Text className="text-darkText text-base leading-relaxed mt-8">
              You can reply to this email,
              <br />
              Bill – Founder of Rybbit
            </Text>

            <Hr className="border-borderColor my-8" />

            <Text className="text-mutedText text-xs">
              <Link href={unsubscribeUrl} className="text-mutedText underline">
                Unsubscribe
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
