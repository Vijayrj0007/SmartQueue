import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Avoid picking a parent folder lockfile (e.g. C:\Users\<user>\package-lock.json) as the monorepo root
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    // Proxy browser -> backend through Next.js to avoid any CORS/network issues.
    // NEXT_PUBLIC_API_URL is expected to be something like:
    // - local:   http://localhost:5000/api
    // - prod:    https://<render-app>.onrender.com/api
    const envApi = process.env.NEXT_PUBLIC_API_URL;
    if (!envApi) {
      throw new Error("NEXT_PUBLIC_API_URL must be set (e.g. http://127.0.0.1:5000/api for dev, https://<render>/api for prod).");
    }
    const backendOrigin = envApi.replace(/\/api\/?$/i, "");

    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
