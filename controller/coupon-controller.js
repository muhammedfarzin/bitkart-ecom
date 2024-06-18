import { Types } from "mongoose";
import CategoryModel from "../models/category-model.js";
import CouponModel from "../models/coupon-model.js";
import categoryController from "./category-controller.js";
import orderController from "./order-controller.js";

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
    getCouponById: async (couponId) => {
        try {
            couponId = Types.ObjectId.createFromHexString(couponId);
            const coupon = await CouponModel.findById(couponId);
            return coupon.toObject();
        } catch (err) {
            if (err.name === 'BSONError') {
                throw new Error('Coupon not found');
            } else {
                throw err;
            }
        }
    },
    getCouponByPromocode: async (promocode) => {
        promocode = promocode.replace(/\s/, '').toUpperCase();
        const coupon = await CouponModel.findOne({ code: promocode });
        if (!coupon) throw new Error('Promocode not found');
        return coupon.toObject();
    },
    verifyCoupon: async (userId, promocode) => {
        const coupon = await couponController.getCouponByPromocode(promocode);
        let checkoutAmountSummary = await orderController.getPriceSummary(userId);
        const minPurchaseAmount = coupon.minPurchaseAmount;
        const maxDiscountAmount = coupon.maxDiscountAmount;

        if (coupon.categoryId) {
            const cart = await orderController.getCartProducts(userId);
            for (let cartData of cart) {
                const product = cartData.productDetails;
                const amount = product.offerPrice || product.price;
                if (coupon.categoryId.toString() == product.categoryId) {
                    if (amount >= minPurchaseAmount) {
                        checkoutAmountSummary.couponCategoryId = product.categoryId;
                        checkoutAmountSummary.promocodeDiscount = maxDiscountAmount >= amount ? amount : maxDiscountAmount;
                        break;
                    } else throw new Error(`This promocode needs to purchase atleast ₹${minPurchaseAmount}`);
                } else throw new Error('This promocode is not available for the selected products');
            }
        } else {
            if (checkoutAmountSummary.totalPrice >= minPurchaseAmount) {
                const amount = checkoutAmountSummary.totalPrice;
                checkoutAmountSummary.promocodeDiscount = maxDiscountAmount >= amount ? amount : maxDiscountAmount;
            } else throw new Error(`This promocode needs to purchase atleast ₹${minPurchaseAmount}`);
        }

        return checkoutAmountSummary;
    },
    editCoupon: async (couponId, data) => {
        try {
            couponId = Types.ObjectId.createFromHexString(couponId);
            let { code, title, description, validUpto, category, discountValue, discountType, minPurchaseAmount, maxDiscountAmount } = data;
            let categoryId = null;
            if (!code || !title || !description, !validUpto, !discountValue, !discountType, !minPurchaseAmount, !maxDiscountAmount) {
                throw new Error('Please fill complete form');
            }
            validUpto = new Date(validUpto);
            code = code.replace(/\s/, '').toUpperCase();

            if (category) {
                categoryId = Types.ObjectId.createFromHexString(category);
                const categoryData = await categoryController.getCategoryById(categoryId);
                if (!categoryData) throw new Error('Selected category not found');
            }
            if (validUpto <= Date.now()) throw new Error('Valid upto date cannot be past');

            const coupon = await CouponModel.findById(couponId);
            if (coupon.code != code) {
                const existCouponCode = await CouponModel.find({ code });
                if (existCouponCode) throw new Error('The coupon code is already exist');
            }

            await coupon.updateOne({
                code,
                title,
                description,
                categoryId,
                validUpto,
                discountValue,
                discountType,
                minPurchaseAmount,
                maxDiscountAmount
            });

            const response = { message: 'Coupon succesfully updated' };
            return response;
        } catch (err) {
            if (err.name === 'BSONError') {
                throw new Error('Coupon not found');
            } else {
                throw err;
            }
        }
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