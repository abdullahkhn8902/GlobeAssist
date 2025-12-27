/** @type {import('next').NextConfig} */
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ✅ Fix pdf-parse runtime issues in Next (server bundling)
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],

  // ✅ Fix Turbopack choosing wrong workspace root (multiple lockfiles)
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
