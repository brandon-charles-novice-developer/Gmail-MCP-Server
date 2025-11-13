import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load credentials from the global Gmail MCP location
const CREDENTIALS_PATH = path.join(process.env.HOME, '.gmail-mcp', 'credentials.json');
const OAUTH_KEYS_PATH = path.join(process.env.HOME, '.gmail-mcp', 'gcp-oauth.keys.json');

async function createDraft() {
  try {
    // Load OAuth keys
    const oauthKeys = JSON.parse(fs.readFileSync(OAUTH_KEYS_PATH, 'utf8'));
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

    // Get the correct key structure
    const keys = oauthKeys.installed || oauthKeys.web;

    if (!keys) {
      throw new Error('Invalid OAuth keys file format. Should contain either "installed" or "web" credentials.');
    }

    // Create OAuth2 client with proper redirect URI
    const redirectUri = keys.redirect_uris ? keys.redirect_uris[0] : 'http://localhost:3000/oauth2callback';
    const oauth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      redirectUri
    );

    // Set credentials
    oauth2Client.setCredentials(credentials);

    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Email content
    const subject = 'Young Sherlock 2026 - Animated Custom Mocks Ready for Review';
    const recipientName = '[Recipient Name]';
    const yourName = '[Your Name]';
    const yourPhone = '[Phone]';
    const yourEmail = '[Email]';

    const emailBody = `Hi ${recipientName},

Great news! Our creative team has completed the animated Young Sherlock custom mocks for the 2026 campaign, and they're ready for your review.

**The Creative Experience:**

The unit begins with a magnifying glass as a bottom adhesion element. As users scroll through premium editorial content, the 100% SOV High-Rise Billboard Takeover (HRBTO) comes into full view, where the magnifying glass dynamically animates into various shots of Young Sherlock's imagery—delivering a cinematic reveal at optimal viewability.

This scroll-triggered animation creates an immersive storytelling moment that:
- Captures attention with native bottom adhesion placement
- Leverages user engagement through scroll behavior
- Delivers 100% share of voice with premium HRBTO placement
- Maximizes viewability through timed cinematic reveal
- Showcases Young Sherlock's visual identity across cross-platform environments

**Preview the Mocks:**
- **Mobile Experience:** [MOBILE_DEMO_LINK_PLACEHOLDER]
- **Desktop Experience:** [DESKTOP_DEMO_LINK_PLACEHOLDER]

Let us know if you have any questions as you review - as always, happy to help!

Best,
${yourName}
Account Executive, Kargo
${yourPhone}
${yourEmail}`;

    // Create the email in RFC 2822 format
    const email = [
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      emailBody
    ].join('\n');

    // Encode the email
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Create draft
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedEmail
        }
      }
    });

    console.log('✅ Draft created successfully!');
    console.log(`Draft ID: ${response.data.id}`);
    console.log('\nYou can now edit this draft in Gmail to:');
    console.log('1. Replace [Recipient Name] with the actual recipient');
    console.log('2. Add the recipient email address');
    console.log('3. Replace [MOBILE_DEMO_LINK_PLACEHOLDER] with the mobile demo link');
    console.log('4. Replace [DESKTOP_DEMO_LINK_PLACEHOLDER] with the desktop demo link');
    console.log('5. Replace [Your Name], [Phone], and [Email] with your details');

  } catch (error) {
    console.error('❌ Error creating draft:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

createDraft();
