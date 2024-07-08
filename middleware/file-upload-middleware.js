import path from "path";
import multer from "multer";

export const uploadImage = multer({
    storage: multer.diskStorage({
        destination: './public/images/uploads/',
        filename: (req, file, cb) => {
            const randomNumber = Math.floor(Math.random() * 90000) + 10000;
            cb(null, file.fieldname + Date.now() + randomNumber + path.extname(file.originalname));
        }
    })
});