import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/student-report': [
      './node_modules/@fontsource/noto-sans-myanmar/files/noto-sans-myanmar-latin-400-normal.woff',
      './node_modules/@fontsource/noto-sans-myanmar/files/noto-sans-myanmar-latin-700-normal.woff',
      './node_modules/@fontsource/noto-sans-myanmar/files/noto-sans-myanmar-myanmar-400-normal.woff',
      './node_modules/@fontsource/noto-sans-myanmar/files/noto-sans-myanmar-myanmar-700-normal.woff',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
