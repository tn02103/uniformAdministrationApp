/** @type {import('next').NextConfig} */
const nextConfig = {
    distDir: "build",
    eslint: {
        dirs: ["src", "tests"],
        ignoreDuringBuilds: true,
    },
    serverExternalPackages: ["rate-limiter-flexible"],
}

export default nextConfig;
