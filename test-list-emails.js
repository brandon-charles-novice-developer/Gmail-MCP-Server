#!/usr/bin/env node

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.gmail-mcp');
const OAUTH_PATH = path.join(CONFIG_DIR, 'gcp-oauth.keys.json');
const CREDENTIALS_PATH = path.join(CONFIG_DIR, 'credentials.json');

async function listEmails() {
    try {
        // Load OAuth keys
        const keysContent = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
        const keys = keysContent.installed || keysContent.web;

        // Initialize OAuth2 client
        const oauth2Client = new OAuth2Client(
            keys.client_id,
            keys.client_secret,
            "http://localhost:3000/oauth2callback"
        );

        // Load saved credentials
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        oauth2Client.setCredentials(credentials);

        // Initialize Gmail API
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        console.log('Fetching your last 10 emails...\n');

        // List messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
        });

        const messages = response.data.messages || [];

        if (messages.length === 0) {
            console.log('No messages found.');
            return;
        }

        console.log(`Found ${messages.length} emails:\n`);

        // Fetch details for each message
        for (let i = 0; i < messages.length; i++) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: messages[i].id,
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date']
            });

            const headers = msg.data.payload.headers;
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
            const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
            const date = headers.find(h => h.name === 'Date')?.value || 'Unknown';

            console.log(`${i + 1}. ${subject}`);
            console.log(`   From: ${from}`);
            console.log(`   Date: ${date}`);
            console.log(`   ID: ${messages[i].id}`);
            console.log('');
        }

    } catch (error) {
        console.error('Error listing emails:', error.message);
        process.exit(1);
    }
}

listEmails();
