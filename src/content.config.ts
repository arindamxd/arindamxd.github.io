import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Declares the blogs folder so Astro does not auto-generate a collection.
 * Runtime loading still goes through src/utils/blogs.ts (JSON catalog + raw MD).
 */
const blogs = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/blogs" }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        banner: z.string(),
    }),
});

export const collections = { blogs };
