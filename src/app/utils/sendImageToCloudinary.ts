import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import multer, { StorageEngine } from "multer";
import path from "path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import config from "../config";

// Cloudinary config
cloudinary.config({
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Image optimization guard:
 * - Resizes images exceeding 2048x2048 (preserving aspect ratio, without upscaling)
 * - Auto-orients image based on EXIF orientation
 * - Compresses to high-quality WebP (85% quality) to significantly reduce size while preserving crystal-clear resolution
 * - Bypasses SVGs and animated GIFs to prevent distortion
 */
export const optimizeImageBuffer = async (
  buffer: Buffer,
  mimetype: string,
): Promise<{ buffer: Buffer; mimetype: string }> => {
  if (!mimetype.startsWith("image/") || mimetype === "image/svg+xml") {
    return { buffer, mimetype };
  }

  try {
    const image = sharp(buffer, { animated: mimetype === "image/gif" });
    const metadata = await image.metadata();

    // Preserve animated GIFs without conversion
    if (metadata.format === "gif" || mimetype === "image/gif") {
      return { buffer, mimetype };
    }

    const optimizedBuffer = await image
      .rotate() // Auto-orient based on EXIF tag
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    return { buffer: optimizedBuffer, mimetype: "image/webp" };
  } catch (error) {
    console.warn(
      "Image optimization skipped due to error, proceeding with original buffer:",
      error,
    );
    return { buffer, mimetype };
  }
};

/**
 * PDF optimization guard:
 * - Compresses PDF objects and cross-reference streams using PDF object streams
 * - Cleans metadata overhead and redundant structures while preserving 100% document quality
 */
export const optimizePdfBuffer = async (buffer: Buffer): Promise<Buffer> => {
  try {
    const pdfDoc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    const savedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    const optimizedBuffer = Buffer.from(savedBytes);
    return optimizedBuffer.length < buffer.length ? optimizedBuffer : buffer;
  } catch (error) {
    console.warn(
      "PDF optimization skipped due to error, proceeding with original buffer:",
      error,
    );
    return buffer;
  }
};

/**
 * DOCX optimization guard:
 * - Re-compresses OpenXML package components using maximum DEFLATE (level 9)
 * - Reduces docx container size without altering document contents or formatting
 */
export const optimizeDocxBuffer = async (buffer: Buffer): Promise<Buffer> => {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const compressed = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });
    return compressed.length < buffer.length ? compressed : buffer;
  } catch (error) {
    console.warn(
      "DOCX optimization skipped due to error, proceeding with original buffer:",
      error,
    );
    return buffer;
  }
};

// Upload Function
export const sendFileToCloudinary = async (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string,
): Promise<UploadApiResponse> => {
  if (!fileBuffer) throw new Error("Missing file buffer");
  if (!mimetype) throw new Error("Missing mimetype");

  const nameWithoutExt = path.parse(fileName).name;

  // ============================
  // 1️⃣ IMAGE Upload (with optimization guard)
  // ============================
  if (mimetype.startsWith("image/")) {
    const { buffer: processedBuffer } = await optimizeImageBuffer(
      fileBuffer,
      mimetype,
    );

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `${Date.now()}-${nameWithoutExt}`,
          resource_type: "image",
          folder: "RMSG/images",
          transformation: [
            { width: 2048, height: 2048, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result from Cloudinary"));
          return resolve(result);
        },
      );
      uploadStream.end(processedBuffer);
    });
  }

  // ============================
  // 2️⃣ PDF + WORD Uploads (with compression guard)
  // ============================
  else if (
    mimetype === "application/pdf" ||
    mimetype === "application/msword" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const ext = path.extname(fileName);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "");

    let processedBuffer = fileBuffer;

    if (mimetype === "application/pdf" || ext.toLowerCase() === ".pdf") {
      processedBuffer = await optimizePdfBuffer(fileBuffer);
    } else if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext.toLowerCase() === ".docx"
    ) {
      processedBuffer = await optimizeDocxBuffer(fileBuffer);
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `${Date.now()}-${safeName}${ext}`,
          resource_type: "raw",
          folder: "RMSG/docs",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result from Cloudinary"));
          return resolve(result);
        },
      );
      uploadStream.end(processedBuffer);
    });
  }

  // ============================
  // 3️⃣ AUDIO Upload (mp3, wav, webm, m4a, ogg etc.)
  // ============================
  else if (mimetype.startsWith("audio/")) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `${Date.now()}-${nameWithoutExt}`,
          resource_type: "video", // REQUIRED for audio files in Cloudinary
          folder: "RMSG/audio",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result from Cloudinary"));
          return resolve(result);
        },
      );
      uploadStream.end(fileBuffer);
    });
  }

  // ============================
  // ❌ Unsupported file
  // ============================
  else {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }
};

// Multer memory storage for receiving files
const storage: StorageEngine = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "audio/",
    ];

    const isAllowed = allowedTypes.some((type) =>
      file.mimetype.startsWith(type),
    );

    if (!isAllowed) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  },
});
