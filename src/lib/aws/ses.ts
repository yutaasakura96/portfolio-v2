import { SESClient } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

export const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL!;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL!;
