/**
 * Generate self-signed certificate for local HTTPS development
 * Run: node scripts/generate-cert.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// Check if OpenSSL is available
try {
  execSync('openssl version', { stdio: 'ignore' });
  
  console.log('Generating self-signed certificate...');
  
  // Generate private key
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // Generate certificate (valid for 365 days)
  execSync(
    `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1,IP:::1"`,
    { stdio: 'inherit' }
  );
  
  console.log('\n✅ Certificate generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('\n⚠️  You may need to accept the security warning in your browser.');
  console.log('   On mobile, you may need to install the certificate as a trusted certificate.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Alternative: Install OpenSSL or use mkcert:');
  console.log('   1. Install mkcert: https://github.com/FiloSottile/mkcert');
  console.log('   2. Run: mkcert -install');
  console.log('   3. Run: mkcert localhost 127.0.0.1 ::1');
  console.log('   4. Move the generated files to certs/ folder');
}




























































