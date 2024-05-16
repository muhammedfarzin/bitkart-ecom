import { Schema, model } from "mongoose";

const productReviewSchema = new Schema({
    starRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    productId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const productReviewModel = model('productReview', productReviewSchema, 'productReviews');

export default productReviewModel;