import { authenticate } from '@google-cloud/local-auth';
import fs from 'fs';
import { AuthClient, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import path from 'path';

const TOKEN_PATH = path.join(__dirname, '../../secrets/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../secrets/credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// This file adapted from:
// https://developers.google.com/sheets/api/quickstart/nodejs.

/**
 * Reads previously authorized credentials from the saved file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} credentials
 * @return {Promise<void>}
 */
async function saveCredentials(
  credentials: AuthClient['credentials'],
): Promise<void> {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: credentials.refresh_token,
  });
  fs.writeFileSync(TOKEN_PATH, payload, 'utf-8');
}

/**
 * Load or request or authorization to call APIs.
 */
export async function authorize(): Promise<OAuth2Client> {
  const client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  const localClient = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (localClient.credentials) {
    await saveCredentials(localClient.credentials);
  }
  return localClient;
}
