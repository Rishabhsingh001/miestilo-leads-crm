import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Miestilo Leads CRM',
        short_name: 'Miestilo CRM',
        description: 'Advanced Lead Management System',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/m-icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/m-icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
        ],
    }
}
