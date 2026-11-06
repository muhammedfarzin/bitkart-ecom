import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import multer from "multer";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const TARGET_IMAGE_BYTES = 500 * 1024;
const formats = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
const destination = "public/images/uploads";

const createFileParser = (count) => multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: count,
    fields: 30,
    parts: 30 + count,
    fieldSize: 64 * 1024,
  },
  fileFilter: (_req, file, cb) =>
    cb(
      formats[file.mimetype]
        ? null
        : new Error("Only JPEG, PNG and WebP images are allowed."),
      Boolean(formats[file.mimetype]),
    ),
});

export async function compressImage(buffer, mimetype) {
  const image = sharp(buffer, {
    limitInputPixels: 40_000_000,
    failOn: "warning",
  });
  const metadata = await image.metadata();
  if (
    !formats[mimetype] ||
    metadata.format !== formats[mimetype] ||
    (metadata.pages || 1) > 1
  ) {
    throw new Error(
      "Only valid, non-animated JPEG, PNG and WebP images are allowed.",
    );
  }
  // Re-encode even small images to discard untrusted original bytes and metadata.
  const initialDimension = Math.min(1600, Math.max(metadata.width, metadata.height));
  const minimumDimension = Math.min(100, initialDimension);
  for (
    let dimension = initialDimension;
    dimension >= minimumDimension;
    dimension = Math.floor(dimension * 0.75)
  ) {
    for (const quality of [82, 65, 45]) {
      const output = await image
        .clone()
        .rotate()
        .resize(dimension, dimension, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();
      if (output.length <= TARGET_IMAGE_BYTES) return output;
    }
  }
  throw new Error("Image could not be compressed to 500 KB.");
}

function upload(field, count, single) {
  const fileParser = createFileParser(count);
  const parse = single
    ? fileParser.single(field)
    : fileParser.array(field, count);
  return (req, res, next) => {
    parse(req, res, async (error) => {
      const written = [];
      try {
        if (error) throw error;
        const files = single ? (req.file ? [req.file] : []) : req.files || [];
        for (const file of files) {
          let output;
          try {
            output = await compressImage(file.buffer, file.mimetype);
          } catch {
            throw new Error(
              "Invalid image. Use a non-animated JPEG, PNG or WebP under 40 megapixels.",
            );
          }
          await mkdir(destination, { recursive: true });
          file.filename = randomUUID() + ".webp";
          file.destination = destination;
          file.path = destination + "/" + file.filename;
          await writeFile(file.path, output, { flag: "wx" });
          written.push(file.path);
          file.size = output.length;
          file.mimetype = "image/webp";
          delete file.buffer;
        }
        next();
      } catch (err) {
        await Promise.allSettled(written.map((file) => unlink(file)));
        const tooLarge = err.code === "LIMIT_FILE_SIZE";
        const message = tooLarge
          ? "Each image must be smaller than 10 MB."
          : err instanceof multer.MulterError
            ? "Upload exceeds the allowed file count or form size."
            : err.code
              ? "Unable to save uploaded images."
              : err.message;
        res.status(tooLarge ? 413 : 400).json({ errMessage: message });
      }
    });
  };
}

export const uploadImage = {
  single: (field) => upload(field, 1, true),
  array: (field, count = 5) => upload(field, count, false),
};
