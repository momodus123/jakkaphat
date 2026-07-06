import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google OAuth credentials check
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  const APP_URL = process.env.APP_URL || 'http://localhost:3000';

  // Endpoint: Get Google OAuth Authorization URL or Demo info
  app.get('/api/auth/google/url', (req, res) => {
    // If keys are not present, trigger the Demo/Sandbox flow
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.json({
        isDemo: true,
        url: `${APP_URL}/auth/callback/demo`
      });
    }

    // Production Google OAuth URL setup
    const redirectUri = `${APP_URL}/auth/callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state: 'secure-state'
    });

    res.json({
      isDemo: false,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    });
  });

  // Endpoint: Real Google Callback Handler
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fef2f2; color: #991b1b;">
            <div style="text-align: center; padding: 2rem; border: 1px solid #fee2e2; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h2 style="margin-top: 0;">เกิดข้อผิดพลาดในการเข้าสู่ระบบ</h2>
              <p>${error}</p>
              <button onclick="window.close()" style="background-color: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">ปิดหน้าต่างนี้</button>
            </div>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.redirect('/');
    }

    try {
      // Exchange Code for Access Token
      const redirectUri = `${APP_URL}/auth/callback`;
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errBody}`);
      }

      const tokens = await tokenResponse.json();
      const accessToken = tokens.access_token;

      // Fetch User profile using the access token
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userData = await userResponse.json();
      const user = {
        name: userData.name || userData.given_name || 'ผู้ใช้งาน Google',
        email: userData.email,
        picture: userData.picture || ''
      };

      // Send the logged-in user object back to the main app window and close popup
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
            <div style="text-align: center;">
              <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
              <h3 style="color: #1e293b; margin: 0;">กำลังเข้าสู่ระบบราชการด้วย Google...</h3>
              <p style="color: #64748b; font-size: 0.875rem;">กรุณารอสักครู่ หน้าต่างนี้จะปิดตัวลงโดยอัตโนมัติ</p>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(user)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Google OAuth Callback error:', err);
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fef2f2; color: #991b1b;">
            <div style="text-align: center; padding: 2rem; border: 1px solid #fee2e2; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h2 style="margin-top: 0;">เกิดข้อผิดพลาดด้านเทคนิค</h2>
              <p style="font-size: 0.875rem; color: #b91c1c;">${err.message || 'ไม่สามารถแลกเปลี่ยนรหัสโทเคนของ Google ได้'}</p>
              <button onclick="window.close()" style="background-color: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">ปิดหน้าต่างนี้</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Endpoint: Demo Sandbox Callback (Used for instant testing in the AI Studio platform)
  app.get('/auth/callback/demo', (req, res) => {
    // Generate simulated user depending on current metadata/user config
    const demoUser = {
      name: 'โมโมดัส แสนดี (เจ้าหน้าที่สารบรรณ)',
      email: 'momodus12345@gmail.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150'
    };

    res.send(`
      <html>
        <head>
          <title>Google Accounts - Sandbox Authentication</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f1f5f9; padding: 16px;">
          <div style="background: white; max-width: 400px; width: 100%; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); padding: 32px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="display: flex; justify-content: center; margin-bottom: 24px;">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.75H24v9h12.75C35.1 32.25 30.65 35 24 35c-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48c12.3 0 22.5-9.15 22.5-24z"/>
                <path fill="#FBBC05" d="M10.54 28.91C10.04 27.41 9.75 25.75 9.75 24s.29-3.41.79-4.91L2.56 12.9C.92 16.18 0 19.96 0 24s.92 7.82 2.56 11.1l7.98-6.19z"/>
                <path fill="#34A853" d="M24 38.5c6.26 0 11.57-4.22 13.46-9.91l7.98 6.19C41.49 42.62 33.38 48 24 48c-9.38 0-17.49-5.38-21.44-13.22l7.98-6.19c1.89 5.69 7.2 9.91 13.46 9.91z"/>
              </svg>
            </div>
            
            <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 1.5rem; font-weight: 700;">Google Sign-In</h2>
            <p style="color: #64748b; font-size: 0.875rem; margin: 0 0 24px;">เพื่อการทดสอบในสภาพแวดล้อมจำลอง (Sandbox Preview)</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <img src="${demoUser.picture}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e2e8f0;" alt="Avatar">
              <div>
                <div style="font-weight: 600; color: #1e293b; font-size: 0.95rem;">${demoUser.name}</div>
                <div style="font-size: 0.8rem; color: #64748b;">${demoUser.email}</div>
              </div>
            </div>

            <p style="color: #ea580c; background: #fff7ed; border: 1px solid #ffedd5; font-size: 0.75rem; padding: 10px; border-radius: 8px; margin-bottom: 24px; text-align: left; line-height: 1.4;">
              ⚠️ <b>แจ้งเตือนผู้พัฒนา:</b> คุณกำลังใช้โหมดทดสอบจำลอง เนื่องจากยังไม่ได้กำหนดค่าคีย์ GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ในตัวแปรสภาพแวดล้อม (Settings &gt; Secrets)
            </p>

            <button id="signInBtn" style="background-color: #1a73e8; hover:background-color: #1557b0; color: white; border: none; width: 100%; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 0.9rem;">
              อนุญาตและลงชื่อเข้าใช้งาน
            </button>
          </div>

          <script>
            document.getElementById('signInBtn').addEventListener('click', function() {
              this.disabled = true;
              this.innerText = 'กำลังส่งต่อข้อมูลสำเร็จ...';
              
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(demoUser)} 
                }, '*');
                setTimeout(() => window.close(), 400);
              } else {
                window.location.href = '/';
              }
            });
          </script>
        </body>
      </html>
    `);
  });

  // Mount Vite middleware for development or Static Asset serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Full-Stack App is running on http://localhost:${PORT}`);
  });
}

startServer();
