# Local HTTPS Setup for Camera/Microphone Access

To use camera and microphone features (board photo uploads) from your phone on the local network, you need HTTPS.

## Quick Setup

### Option 1: Generate Self-Signed Certificate (Recommended)

1. **Make sure OpenSSL is installed:**
   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
   - Mac: Usually pre-installed
   - Linux: `sudo apt-get install openssl`

2. **Generate certificate:**
   ```bash
   node scripts/generate-cert.js
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Access from phone:**
   - Use `https://[your-ip]:8080` instead of `http://`
   - Accept the security warning (it's safe for local development)
   - Camera and microphone will now work!

### Option 2: Use mkcert (Easier, but requires installation)

1. **Install mkcert:**
   - Windows: `choco install mkcert` or download from https://github.com/FiloSottile/mkcert
   - Mac: `brew install mkcert`
   - Linux: See mkcert GitHub page

2. **Install local CA:**
   ```bash
   mkcert -install
   ```

3. **Generate certificate:**
   ```bash
   mkdir certs
   cd certs
   mkcert localhost 127.0.0.1 ::1 [your-local-ip]
   mv localhost+3.pem cert.pem
   mv localhost+3-key.pem key.pem
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Mobile Setup

On your phone, when you first access `https://[your-ip]:8080`:

1. **iOS Safari:**
   - You'll see a security warning
   - Tap "Advanced" → "Proceed to [your-ip] (unsafe)"
   - Camera/mic will work!

2. **Android Chrome:**
   - You'll see a security warning
   - Tap "Advanced" → "Proceed to [your-ip] (unsafe)"
   - Camera/mic will work!

## Finding Your Local IP

**Windows:**
```powershell
ipconfig | findstr IPv4
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

## Troubleshooting

- **Certificate not found:** Make sure `certs/key.pem` and `certs/cert.pem` exist
- **Still can't access camera:** Make sure you're using `https://` not `http://`
- **Security warning:** This is normal for self-signed certificates - it's safe for local development

## Note

The certificate is only for local development. For production, use a proper SSL certificate from a trusted CA.




























































