import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Secure Proxy for Google Apps Script Web App
  app.get('/api/proxy-attendance', async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'Missing url parameter' });
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(targetUrl);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid URL format' });
      }

      if (!parsedUrl.hostname.endsWith('google.com') && !parsedUrl.hostname.endsWith('googleusercontent.com')) {
        return res.status(403).json({ success: false, error: 'Only Google Apps Script endpoints are allowed' });
      }

      // Add timestamp to prevent caching
      parsedUrl.searchParams.set('_t', Date.now().toString());

      const response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 RFID-Attendance-Dashboard/1.0',
        },
        redirect: 'follow',
      });

      const responseText = await response.text();
      let responseJson: any;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        return res.status(502).json({
          success: false,
          error: 'Google Apps Script returned an HTML or non-JSON response. Ensure deployment "Who has access" is set to "Anyone" and execute as "Me".',
          rawSnippet: responseText.slice(0, 300),
        });
      }

      return res.json(responseJson);
    } catch (err: any) {
      console.error('Proxy error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to proxy request to Google Apps Script',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
