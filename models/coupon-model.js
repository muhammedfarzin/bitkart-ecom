import { Schema, Types, model } from "mongoose";

const couponSchema = new Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 1
    },
    discountType: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^(flat|percentage)$/.test(value);
            },
            message: 'Discount type must be either "flat" or "percentage"'
        }
    },
    categoryId: Types.ObjectId,
    validUpto: {
        type: Date,
        required: true
    },
    minPurchaseAmount: {
        type: Number,
        required: true,
        min: 10
    },
    maxDiscountAmount: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true,
});

const CouponModel = model('coupon', couponSchema, 'coupons');

export default CouponModel;