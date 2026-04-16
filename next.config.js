/** @type {import('next').NextConfig} */
const nextConfig = {
    distDir: "build",
    sassOptions: {
        // Bootstrap 5 uses legacy Sass @import and deprecated built-ins internally.
        // quietDeps silences warnings from node_modules; silenceDeprecations covers
        // the one remaining @import in global.scss needed for Bootstrap theming.
        // Full @use migration requires Bootstrap 6.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
    },
    experimental: {
        turbopackFileSystemCacheForDev: true,
    },
    reactCompiler: true,
    allowedDevOrigins: JSON.parse(process.env.NEXT_PUBLIC_DEV_ORIGIN || "[]"),
}

export default nextConfig;
