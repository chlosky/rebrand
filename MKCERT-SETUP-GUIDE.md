# mkcert Setup Guide for Windows

## Step 1: Install mkcert

### Option A: Using Chocolatey (Easiest)
1. Open PowerShell as Administrator (Right-click → Run as Administrator)
2. If you don't have Chocolatey, install it first:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```
3. Install mkcert:
   ```powershell
   choco install mkcert
   ```

### Option B: Manual Installation
1. Go to https://github.com/FiloSottile/mkcert/releases
2. Download `mkcert-v1.4.4-windows-amd64.exe` (or latest version)
3. Rename it to `mkcert.exe`
4. Move it to a folder in your PATH (like `C:\Windows\System32`) OR add the folder to your PATH

## Step 2: Install the Local CA

Open PowerShell (regular is fine, no need for admin) and run:

```powershell
mkcert -install
```

This will install a local certificate authority on your computer. You'll see a success message.

## Step 3: Find Your Local IP Address

Open PowerShell and run:

```powershell
ipconfig | findstr IPv4
```

You'll see something like:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

Copy that IP address (the numbers like `192.168.1.100`).

## Step 4: Generate Certificates

1. Open PowerShell in your project directory (where `package.json` is)
2. Create the certs folder:
   ```powershell
   mkdir certs
   ```
3. Navigate into it:
   ```powershell
   cd certs
   ```
4. Generate the certificate (replace `192.168.1.100` with YOUR IP from Step 3):
   ```powershell
   mkcert localhost 127.0.0.1 ::1 192.168.1.100
   ```
   (Replace `192.168.1.100` with your actual IP address)

5. This will create two files. Rename them:
   ```powershell
   move localhost+3.pem cert.pem
   move localhost+3-key.pem key.pem
   ```
   (The number might be different - just rename whatever files were created)

6. Go back to project root:
   ```powershell
   cd ..
   ```

## Step 5: Restart Your Dev Server

Stop your current dev server (Ctrl+C) and restart it:

```powershell
npm run dev
```

You should see it starting on `https://localhost:8080` instead of `http://`.

## Step 6: Access from Your Phone

1. Find your computer's IP address again (from Step 3)
2. On your phone, open a browser and go to:
   ```
   https://192.168.1.100:8080
   ```
   (Replace with your actual IP)

3. You'll see a security warning - that's normal! Tap "Advanced" or "Show Details"
4. Tap "Proceed" or "Continue" (it will say "unsafe" but it's fine for local development)
5. Camera and microphone will now work! 🎉

## Troubleshooting

**"mkcert is not recognized"**
- Make sure mkcert is installed and in your PATH
- Try restarting PowerShell
- Or use the full path: `C:\path\to\mkcert.exe -install`

**"Certificate files not found"**
- Make sure you're in the project root directory
- Check that `certs/cert.pem` and `certs/key.pem` exist
- The files must be named exactly `cert.pem` and `key.pem`

**"Still can't access camera"**
- Make sure you're using `https://` not `http://`
- Make sure you included your IP address in the mkcert command
- Try restarting the dev server




























































