const nextConfig = {
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
    async redirects() {
        return [
            {
                source: '/docs',
                destination: 'https://docs.prismio.org',
                permanent: false,
            },
            {
                source: '/playground',
                destination: 'https://playground.prismio.org',
                permanent: false,
            },
            {
                source: '/packages',
                destination: 'https://packages.prismio.org',
                permanent: false,
            },
            {
                source: '/developers',
                destination: 'https://developers.prismio.org',
                permanent: false,
            },
        ];
    },
}

export default (nextConfig)