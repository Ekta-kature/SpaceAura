// config/cloudinary.js — Image uploads (gracefully skipped if not configured)
let cloudinaryInstance, CloudinaryStorage, multer;

try {
  cloudinaryInstance = require('cloudinary').v2;
  CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
  multer = require('multer');
} catch(e) {
  console.warn('Cloudinary packages not installed');
}

if (cloudinaryInstance && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinaryInstance.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('⚠️  Cloudinary not configured — image uploads will be skipped. Add CLOUDINARY_CLOUD_NAME to .env.');
}

const makeStorage = (folder, transforms) => {
  if (!CloudinaryStorage || !cloudinaryInstance || !process.env.CLOUDINARY_CLOUD_NAME) return null;
  return new CloudinaryStorage({
    cloudinary: cloudinaryInstance,
    params: { folder, allowed_formats: ['jpg','jpeg','png','webp'], transformation: transforms },
  });
};

const makeUpload = (storage, sizeMB = 5) => {
  if (!multer || !storage) return null;
  return multer({ storage, limits: { fileSize: sizeMB * 1024 * 1024 } });
};

const productStorage   = makeStorage('spaceaura/products',   [{ width:800, height:800, crop:'limit', quality:'auto' }]);
const portfolioStorage = makeStorage('spaceaura/portfolio',  [{ width:1200, height:900, crop:'limit', quality:'auto' }]);
const avatarStorage    = makeStorage('spaceaura/avatars',    [{ width:400, height:400, crop:'fill', gravity:'face', quality:'auto' }]);

module.exports = {
  cloudinary:       cloudinaryInstance,
  uploadProduct:    makeUpload(productStorage, 5),
  uploadPortfolio:  makeUpload(portfolioStorage, 8),
  uploadAvatar:     makeUpload(avatarStorage, 2),
};
