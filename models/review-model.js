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
    review: {
        type: String
    }
});

reviewSchema.pre('save', function (next) {
    if (this.starRating < 1 || this.starRating > 5) {
        throw new Error('Please select valid starRating');
    }
    next();
});

reviewSchema.pre('updateOne', function (next) {
   const starRating = this._update.starRating;
    if (starRating < 1 || starRating > 5) {
        throw new Error('Please select valid starRating');
    }
    next();
});

const ReviewModel = model('review', reviewSchema, 'reviews');


export default ReviewModel;