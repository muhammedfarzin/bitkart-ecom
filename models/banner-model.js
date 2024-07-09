import { Schema, model } from "mongoose";

const bannerSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    validity: {
        type: Date,
        required: true
    },
    imagePath: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'active'
    }
}, {
    timestamps: true,
});

const BannerModel = model('banner', bannerSchema, 'banners');

export default BannerModel;