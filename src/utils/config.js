import dotenv from 'dotenv';

dotenv.config();

const config = {
  app: {
    host: process.env.APP_HOST,
    port: process.env.APP_PORT,
    baseUrl: process.env.BASE_URL || 'http://localhost:7777',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expired: process.env.JWT_EXPIRED_IN,
  },
  firebase: {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    type: process.env.TYPE,
    privateKeyId: process.env.PRIVATE_KEY_ID,
    privateKey: process.env.PRIVATE_KEY,
    clientEmail: process.env.CLIENT_EMAIL,
    clientId: process.env.CLIENT_ID,
    authUri: process.env.AUTH_URI,
    tokenUri: process.env.TOKEN_URI,
    authProvider: process.env.AUTH_PROVIDER_CERT,
    clientCert: process.env.CLIENT_CERT,
    universeDomain: process.env.UNIVERSE_DOMAIN,
  },
  oauth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    enabled: process.env.EMAIL_ENABLED !== 'false', // Default true, set EMAIL_ENABLED=false to disable
    skipVerification: process.env.NODE_ENV === 'development' && process.env.SKIP_EMAIL_VERIFICATION === 'true',
  },
};

export default config;
