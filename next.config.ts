import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/*': [
      './src/assets/fonts/Z06-Walone-Regular.ttf',
      './src/assets/fonts/Z06-Walone-Bold.ttf',
    ],
    '/api/student-report': [
      './src/assets/fonts/Z06-Walone-Regular.ttf',
      './src/assets/fonts/Z06-Walone-Bold.ttf',
    ],
    '/api/tuition-invoice/[id]': [
      './src/assets/fonts/Z06-Walone-Regular.ttf',
      './src/assets/fonts/Z06-Walone-Bold.ttf',
    ],
    '/api/cron/student-reports': [
      './src/assets/fonts/Z06-Walone-Regular.ttf',
      './src/assets/fonts/Z06-Walone-Bold.ttf',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
