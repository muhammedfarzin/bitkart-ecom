import { Types } from "mongoose";
import CategoryModel from "../models/category-model.js";
import CouponModel from "../models/coupon-model.js";

const couponController = {
    createCoupon: async (data) => {
        try {
            const { code, title, description, validUpto: validity, category, discountValue, discountType, minPurchaseAmount, maxDiscountAmount } = data;
            let categoryId;
            if (!code || !title || !description, !validity, !discountValue, !discountType, !minPurchaseAmount, !maxDiscountAmount) {
                throw new Error('Please fill complete form');
            }
            const validUpto = new Date(validity);

            const existCoupon = await CouponModel.findOne({ code: code.replace(/\s/, '').toUpperCase() });
            if (existCoupon) throw new Error('The coupon code is already exist');

            if (category) {
                categoryId = Types.ObjectId.createFromHexString(category);
                const categoryData = await CategoryModel.findById(categoryId);
                if (!categoryData) throw new Error('Selected category not found');
            }
            if (validUpto <= Date.now()) throw new Error('Valid upto date cannot be past');
            const coupon = new CouponModel({
                code: code.replace(/\s/, '').toUpperCase(),
                title,
                description,
                categoryId,
                validUpto,
                discountValue,
                discountType,
                minPurchaseAmount,
                maxDiscountAmount
            });
            await coupon.save()

            const response = { message: 'Coupon created successfully' };
            return response;
        } catch (err) {
            if (err.name === 'BSONError') {
                throw new Error('Selected category not found');
            } else {
                throw err;
            }
        }
    },
    getAllCoupons: async (limit) => {
        const coupons = await CouponModel.find().limit(limit);
        return coupons.map(coupon => coupon.toObject());
    },
    deleteCoupon: async (couponId) => {
        try {
            couponId = Types.ObjectId.createFromHexString(couponId);
            await CouponModel.findByIdAndDelete(couponId);
            const response = { message: 'Coupon succesfully deleted' };
            return response;
        } catch (err) {
            if (err.name === 'BSONError') {
                throw new Error('Selected category not found');
            } else {
                throw err;
            }
        }
    }
}

export default couponController;