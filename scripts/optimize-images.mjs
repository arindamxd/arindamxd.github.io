/**
 * Resize / recompress raster assets under public/assets.
 * Idempotent: skips a file when it is already within the size budget.
 *
 *   node scripts/optimize-images.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @typedef {{ src: string, maxEdge?: number, format?: "jpeg" | "png" | "webp", quality?: number, dest?: string, square?: boolean, palette?: number }} Job */

/** @type {Job[]} */
const jobs = [
    { src: "public/assets/author/author-grey.png", maxEdge: 280, format: "png", palette: 48 },

    { src: "public/assets/projects/camerax/banner.jpg", maxEdge: 1400, format: "jpeg", quality: 78 },
    { src: "public/assets/projects/coco/banner.jpg", maxEdge: 1400, format: "jpeg", quality: 78 },
    { src: "public/assets/projects/ensecure/banner.jpg", maxEdge: 1400, format: "jpeg", quality: 78 },

    { src: "public/assets/projects/camerax/logo.png", maxEdge: 128, format: "png" },
    { src: "public/assets/projects/coco/logo.png", maxEdge: 128, format: "png" },
    { src: "public/assets/projects/ensecure/logo.png", maxEdge: 128, format: "png" },

    { src: "public/assets/projects/camerax/screenshot-1.png", maxEdge: 1080, format: "png" },
    { src: "public/assets/projects/camerax/screenshot-2.png", maxEdge: 1080, format: "png" },
    { src: "public/assets/projects/camerax/screenshot-3.png", maxEdge: 1080, format: "png" },
    {
        src: "public/assets/projects/camerax/screenshot-4.png",
        dest: "public/assets/projects/camerax/screenshot-4.jpg",
        maxEdge: 1080,
        format: "jpeg",
        quality: 76,
    },
    {
        src: "public/assets/projects/camerax/screenshot-5.png",
        dest: "public/assets/projects/camerax/screenshot-5.jpg",
        maxEdge: 1080,
        format: "jpeg",
        quality: 76,
    },
    {
        src: "public/assets/projects/camerax/screenshot-6.png",
        dest: "public/assets/projects/camerax/screenshot-6.jpg",
        maxEdge: 1080,
        format: "jpeg",
        quality: 76,
    },

    {
        src: "public/assets/testimonials/1589283973304.png",
        dest: "public/assets/testimonials/1589283973304.jpg",
        maxEdge: 520,
        format: "jpeg",
        quality: 68,
    },
    {
        src: "public/assets/testimonials/1604828922394.png",
        dest: "public/assets/testimonials/1604828922394.jpg",
        maxEdge: 520,
        format: "jpeg",
        quality: 68,
    },
    {
        src: "public/assets/testimonials/1616447891865.png",
        dest: "public/assets/testimonials/1616447891865.jpg",
        maxEdge: 520,
        format: "jpeg",
        quality: 68,
    },

    { src: "public/assets/blogs/android-annotation-processors/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },
    { src: "public/assets/blogs/android-context/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },
    { src: "public/assets/blogs/android-dependency-injection/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },
    { src: "public/assets/blogs/ios-uicontrol-and-user-interaction/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },
    { src: "public/assets/blogs/kotlin-multiplatform-architecture/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },
    { src: "public/assets/blogs/upi-intent-launch-ios/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },
    { src: "public/assets/blogs/webrtc-with-swift-ios/banner.jpg", maxEdge: 1180, format: "jpeg", quality: 78 },

    { src: "public/assets/resources/og-image.png", maxEdge: 1200, format: "png" },
];

const blogSlugs = [
    "android-annotation-processors",
    "android-context",
    "android-dependency-injection",
    "ios-uicontrol-and-user-interaction",
    "kotlin-multiplatform-architecture",
    "upi-intent-launch-ios",
    "webrtc-with-swift-ios",
];

function kb(bytes) {
    return `${(bytes / 1024).toFixed(1)}KB`;
}

async function fileSize(filePath) {
    try {
        return (await fs.stat(filePath)).size;
    } catch {
        return 0;
    }
}

/**
 * @param {Job} job
 */
async function runJob(job) {
    const srcPath = path.join(root, job.src);
    const destRel = job.dest ?? job.src;
    const destPath = path.join(root, destRel);
    const format = job.format ?? "jpeg";
    let input = srcPath;
    let before = await fileSize(srcPath);
    if (!before) {
        input = destPath;
        before = await fileSize(destPath);
    }
    if (!before) {
        console.warn(`skip missing ${job.src}`);
        return;
    }

    const image = sharp(input);
    const meta = await image.metadata();
    const maxEdge = job.maxEdge ?? Math.max(meta.width ?? 0, meta.height ?? 0);
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
    const moving = destPath !== input;

    let pipeline = sharp(input).rotate();
    if (job.square) {
        pipeline = pipeline.resize(maxEdge, maxEdge, { fit: "cover", withoutEnlargement: true });
    } else if (longest > maxEdge) {
        pipeline = pipeline.resize({
            width: (meta.width ?? 0) >= (meta.height ?? 0) ? maxEdge : undefined,
            height: (meta.height ?? 0) > (meta.width ?? 0) ? maxEdge : undefined,
            withoutEnlargement: true,
        });
    }

    if (format === "jpeg") {
        pipeline = pipeline.flatten({ background: "#ffffff" }).jpeg({
            quality: job.quality ?? 78,
            mozjpeg: true,
            chromaSubsampling: "4:2:0",
        });
    } else if (format === "webp") {
        pipeline = pipeline.webp({ quality: job.quality ?? 78 });
    } else {
        pipeline = pipeline.png({
            compressionLevel: 9,
            effort: 10,
            ...(job.palette ? { palette: true, colors: job.palette } : {}),
        });
    }

    const buffer = await pipeline.toBuffer();
    const alreadyOk = !moving && buffer.length >= before * 0.95 && longest <= maxEdge;
    if (alreadyOk) {
        console.log(`keep  ${job.src}  ${kb(before)}`);
        return;
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, buffer);
    if (moving) await fs.unlink(srcPath).catch(() => {});
    console.log(`${moving ? "move" : "opt "} ${job.src}  ${kb(before)} → ${kb(buffer.length)}  ${destRel}`);
}

async function writeBlogThumb(slug) {
    const banner = path.join(root, "public/assets/blogs", slug, "banner.jpg");
    const thumb = path.join(root, "public/assets/blogs", slug, "thumb.jpg");
    const beforeBanner = await fileSize(banner);
    if (!beforeBanner) {
        console.warn(`skip thumb, missing banner for ${slug}`);
        return;
    }
    const buffer = await sharp(banner)
        .rotate()
        .resize(162, 162, { fit: "cover" })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer();
    const existing = await fileSize(thumb);
    if (existing && buffer.length >= existing * 0.95 && existing < 12_000) {
        console.log(`keep  blogs/${slug}/thumb.jpg  ${kb(existing)}`);
        return;
    }
    await fs.writeFile(thumb, buffer);
    console.log(`thumb blogs/${slug}/thumb.jpg  ${kb(buffer.length)}`);
}

for (const job of jobs) await runJob(job);
for (const slug of blogSlugs) await writeBlogThumb(slug);
