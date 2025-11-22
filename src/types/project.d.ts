export interface Project {
    slug: string
    title: string
    desc: {
        short: string
        long: string
    }
    images: {
        thumb: string
        thumb_bg_color: string
        banner: string
    }
    page: {
        header: {
            organization: string
            category: string
            released_date: Date
            updated_date: Date
            link?: string
        }
        body: {
            container_top: {
                left_image: {
                    src: string
                    alt: string
                }
                right_image: {
                    src: string
                    alt: string
                }
            }
            container_middle: {
                content: {
                    title: string
                    description: string
                }
                large_image: {
                    src: string
                    alt: string
                }
            }
            container_bottom: {
                content: {
                    title: string
                    description: string
                }
                left_image: {
                    src: string
                    alt: string
                }
                right_image: {
                    src: string
                    alt: string
                }
                large_image: {
                    src: string
                    alt: string
                }
            }
        }
    }
}
