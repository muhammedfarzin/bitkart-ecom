import BannerModel from "../models/banner-model.js";
import fs from "fs";

const bannerController = {
    createBanner: async (data) => {
        const { title, validity, status } = data.body;
        let imagePath = data.file.path.replace('public', '');

        const banner = new BannerModel({ title, validity, status, imagePath });
        const response = await banner.save();
        return response;
    },
    updateBanner: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { title, validity, status } = data.body;
                let imagePath = data.file?.path?.replace('public', '');
                const banner = await BannerModel.findOne();

                const response = await banner.updateOne({ title, validity, imagePath, status }, { new: true });
                if (imagePath) fs.unlink('public' + banner.imagePath, (err) => err && console.error('Old image is not deleted:', err.message));
                resolve(response);
            } catch (err) {
                reject(err);
            }
        });
    },
    getBanners: async (data = {}) => {
        const status = data?.status?.toLowerCase() || /.*/;
        const currentDate = new Date();
        const validityFrom = data.validityFrom || currentDate;
        const banners = await BannerModel.find({
            validity: {
                $gte: validityFrom
            },
            status
        });
        return banners.map(banner => banner.toObject());
    }
}

export default bannerController;