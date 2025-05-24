import multer from "multer";

const imgStorage = multer.memoryStorage();

export const upload = multer({
    storage: imgStorage,
    limits: {
        fileSize: 1024 * 1024 * 14,
    },
});
