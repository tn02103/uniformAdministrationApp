/** @type {import('next').NextConfig} */
const nextConfig = {
    distDir: "build",
    eslint: {
        dirs: ["src", "tests"],
        ignoreDuringBuilds: true,
    },
}

export default nextConfig;
