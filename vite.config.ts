import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

function readBuildSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildSha = readBuildSha();
  /** `npm run dev:mobile` — plain HTTP so phones on your LAN can load without trusting dev certs. */
  const useHttp = mode === "mobiledev";
  // Check for SSL certificates
  const certDir = path.resolve(__dirname, "certs");
  const keyPath = path.join(certDir, "key.pem");
  const certPath = path.join(certDir, "cert.pem");
  
  const https =
    !useHttp && fs.existsSync(keyPath) && fs.existsSync(certPath)
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : false;

  return {
    server: {
      host: true,
      port: 8080,
      https: https,
      strictPort: true,
    },
    define: {
      "import.meta.env.VITE_BUILD_SHA": JSON.stringify(buildSha),
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Better CommonJS interop for libraries like lamejs
      dedupe: ['lamejs'],
    },
    assetsInclude: ["**/*.glb", "**/*.gltf"],
    build: {
      /**
       * ES2020: safe for WKWebView on iOS 15+ (Xcode IPHONEOS_DEPLOYMENT_TARGET 15.0).
       * ES2022 bundles can fail to parse or run on iPhone 11 era / older iOS Safari.
       */
      target: "es2020",
      // Exclude supabase functions from client bundle
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        // Ensure CommonJS modules are properly handled
        output: {
          format: 'es',
          // Manual chunk splitting for better control
          manualChunks: (id) => {
            // Split large vendor libraries
            if (id.includes('node_modules')) {
              if (id.includes('wasm-media-encoders') || id.includes('lamejs')) {
                return 'audio-encoders';
              }
              if (id.includes('@huggingface') || id.includes('@mediapipe')) {
                return 'ml-libs';
              }
              return 'vendor';
            }
            // Let Vite handle audioProcessor chunking automatically to avoid initialization issues
          },
          // Ensure chunk file names are consistent
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Don't include source maps in production to prevent exposing server-side code
      sourcemap: mode === 'development',
      // Clear output directory on build
      emptyOutDir: true,
      // Increase chunk size warning limit for large libraries
      chunkSizeWarningLimit: 1000,
      commonjsOptions: {
        // Transform CommonJS to ES modules
        transformMixedEsModules: true,
        // Include lamejs and MediaPipe in CommonJS transformation
        include: [/lamejs/, /@mediapipe/, /node_modules/],
        // Require all CommonJS dependencies to be transformed
        requireReturnsDefault: 'auto',
      },
    },
    // Explicitly exclude supabase directory from being processed
    optimizeDeps: {
      exclude: ['supabase/functions'],
      include: ['lamejs'],
      // Force re-optimization
      force: false,
    },
    // Clear cache on server start
    clearScreen: true,
    // Ensure public assets are properly served
    publicDir: 'public',
  };
});
