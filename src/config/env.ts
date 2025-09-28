import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'ORDER_NOTIFICATION_EMAIL',
  'GOOGLE_CLIENT_ID',
] as const;

type RequiredEnvKey = typeof requiredEnv[number];

type EnvConfig = {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  adminEmail: string;
  adminEmails: string[];
  adminPassword: string | undefined;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  orderNotificationEmail: string;
  googleClientId: string;
};

const getEnv = (
  key: RequiredEnvKey | 'PORT' | 'NODE_ENV' | 'ADMIN_PASSWORD' | 'ADMIN_EMAILS'
): string | undefined => {
  return process.env[key];
};

for (const key of requiredEnv) {
  if (!getEnv(key)) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const parseAdminEmails = (): string[] => {
  const raw = getEnv('ADMIN_EMAILS') ?? getEnv('ADMIN_EMAIL');

  if (!raw) {
    throw new Error('Missing required environment variable: ADMIN_EMAIL');
  }

  const emails = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  if (emails.length === 0) {
    throw new Error('At least one admin email must be provided via ADMIN_EMAIL or ADMIN_EMAILS');
  }

  return emails;
};

const adminEmails = parseAdminEmails();

export const env: EnvConfig = {
  port: Number(getEnv('PORT') ?? 4000),
  nodeEnv: getEnv('NODE_ENV') ?? 'development',
  databaseUrl: getEnv('DATABASE_URL')!,
  jwtSecret: getEnv('JWT_SECRET')!,
  adminEmail: adminEmails[0]!,
  adminEmails,
  adminPassword: getEnv('ADMIN_PASSWORD'),
  smtpHost: getEnv('SMTP_HOST')!,
  smtpPort: Number(getEnv('SMTP_PORT') ?? 465),
  smtpUser: getEnv('SMTP_USER')!,
  smtpPassword: getEnv('SMTP_PASSWORD')!,
  orderNotificationEmail: getEnv('ORDER_NOTIFICATION_EMAIL')!,
  googleClientId: getEnv('GOOGLE_CLIENT_ID')!,
};
