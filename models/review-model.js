import { Schema, Types, model } from "mongoose";

const reviewSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        required: true
    },
    productId: {
        type: Types.ObjectId,
        required: true
    },
    starRating: {
        type: Number,
        required: true
    },
    Review: {
        type: String
    }
});

const ReviewModel = model('review', reviewSchema, 'reviews');


export default ReviewModel;