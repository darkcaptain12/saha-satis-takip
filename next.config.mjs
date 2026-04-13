/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-leaflet'],
  allowedDevOrigins: ['192.168.6.71'],
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
