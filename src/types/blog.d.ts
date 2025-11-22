export interface Blog {
    slug: string
    title: string
    thumb: string
    author: {
        name: string
        avatar: string
    }
    date: Date
    page: {
        intro: {
            title: string
            paragraph: string
            banner: string
        }
        body: Array<{
            title?: string
            subtitle?: string
            paragraph?: string
            bullets?: string[]
        }>
    }
}
