const nextConfig = {
    transpilePackages: ['lucide-react'],
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
    async redirects() {
        return [
            {
                source: '/docs',
                destination: 'https://docs.prismio.org',
                permanent: true,
            },
            {
                source: '/playground',
                destination: 'https://play.prismio.org',
                permanent: true,
            },
            {
                source: '/packages',
                destination: 'https://packages.prismio.org',
                permanent: true,
            },
            {
                source: '/developers',
                destination: 'https://developers.prismio.org',
                permanent: true,
            },
        ];
    },
}

export default (nextConfig)