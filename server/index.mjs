import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { importPKCS8, SignJWT } from 'jose';

const app = express();
const port = Number(process.env.PORT || 3001);
const teamId = process.env.APPLE_TEAM_ID;
const keyId = process.env.APPLE_MUSIC_KEY_ID;
const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY?.replace(/\\n/g, '\n');

app.use(cors());
app.use(express.json());
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_request, response) => response.json({ ok: true }));

app.get('/api/developer-token', async (_request, response) => {
  if (!teamId || !keyId || !privateKey) {
    return response.status(503).json({ error: 'Apple Music token credentials are not configured on the server.' });
  }

  try {
    const key = await importPKCS8(privateKey, 'ES256');
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(now + 60 * 60 * 24 * 30)
      .sign(key);
    response.set('Cache-Control', 'public, max-age=300');
    return response.json({ token, expiresAt: new Date((now + 60 * 60 * 24 * 30) * 1000).toISOString() });
  } catch (error) {
    console.error('Unable to sign Apple Music developer token:', error instanceof Error ? error.message : 'unknown error');
    return response.status(500).json({ error: 'Could not create an Apple Music developer token.' });
  }
});

app.listen(port, () => console.log(`Apple Music token server listening on port ${port}`));
