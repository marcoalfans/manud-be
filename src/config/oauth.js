import { google } from 'googleapis';
import config from '../utils/config.js';

export const oauth2Client = new google.auth.OAuth2(
  config.oauth.clientId,
  config.oauth.clientSecret,
  process.env.NODE_ENV === 'production' 
    ? 'http://manudaja.my.id:7777/auth/google-callback'
    : 'http://localhost:7777/auth/google-callback',
);

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  include_granted_scopes: true,
});

export { google };
