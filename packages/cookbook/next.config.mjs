import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cs/ui', '@cs/utils'],
  images: {
    loader: 'custom',
    loaderFile: './src/image-loader.js',
  },
};

export default withNextIntl(nextConfig);
