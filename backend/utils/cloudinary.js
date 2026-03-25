const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "jpe",
  "jif",
  "jfif",
  "jfi",
  "png",
  "gif",
  "webp",
  "bmp",
  "dib",
  "tiff",
  "tif",
  "svg",
  "ico",
]);

const uploadToCloudinary = (fileBuffer, originalName, folder = "leave_attachments") => {
  return new Promise((resolve, reject) => {
    const cleanName = originalName.trim();
    const lower = cleanName.toLowerCase();
    const dotIndex = lower.lastIndexOf(".");
    const ext = dotIndex === -1 ? "" : lower.slice(dotIndex + 1);
    const resource_type = IMAGE_EXTENSIONS.has(ext) ? "image" : "raw";
    const baseName = cleanName
      .replace(/^.*[\\/]/, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_");
    const timestamp = Date.now();
    const public_id = `${folder}/${baseName || "asset"}_${timestamp}`;

    const uploadOptions = {
      folder,
      resource_type,
      public_id,
      overwrite: false,
      invalidate: true,
    };

    if (ext && !IMAGE_EXTENSIONS.has(ext)) {
      uploadOptions.format = ext;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (fileUrl) => {
  const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  if (!match) {
    throw new Error("Unable to extract public_id from URL");
  }
  const publicId = match[1]; // preserves folder segments
  const resource_type = fileUrl.includes("/raw/upload/") ? "raw" : "image";
  return cloudinary.uploader.destroy(publicId, { resource_type });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
