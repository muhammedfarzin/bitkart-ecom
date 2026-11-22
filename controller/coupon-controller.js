import {
  validateCouponFields,
  normalizeCouponCode,
  CouponValidationError,
  couponStatus,
} from "../helpers/coupon-validation.js";
import { allocateCouponDiscount } from "../helpers/coupon-discount.js";
import { Types } from "mongoose";
import CategoryModel from "../models/category-model.js";
import CouponModel from "../models/coupon-model.js";

const couponController = {
  createCoupon: async (data) => {
    try {
      data = await validateCouponData(data);
      const coupon = new CouponModel(data);
      await coupon.save();

      const response = { message: "Coupon created successfully" };
      return response;
    } catch (err) {
      if (err.code === 11000)
        throw new CouponValidationError({
          code: "This coupon code already exists.",
        });
      if (err.name === "BSONError") {
        throw new Error("Selected category not found");
      } else {
        throw err;
      }
    }
  },
  getAllCoupons: async (limit, status = "all", search = "") => {
    const now = new Date();
    const filter = {};
    if (status === "deactivated") filter.status = "deactivated";
    else if (["active", "expired", "scheduled"].includes(status)) {
      filter.status = { $ne: "deactivated" };
      filter.validUpto = status === "expired" ? { $lte: now } : { $gt: now };
      if (status === "scheduled") filter.validFrom = { $gt: now };
      if (status === "active")
        filter.$and = [
          { $or: [{ validFrom: { $lte: now } }, { validFrom: null }] },
        ];
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["title", "code", "description"].map((field) => ({
        [field]: { $regex: escaped, $options: "i" },
      }));
    }
    const coupons = await CouponModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);
    return coupons.map((coupon) => ({
      ...coupon.toObject(),
      displayStatus: couponStatus(coupon, now),
    }));
  },
  getCouponById: async (couponId) => {
    try {
      couponId = Types.ObjectId.createFromHexString(couponId);
      const coupon = await CouponModel.findById(couponId);
      if (!coupon) throw new Error("Coupon not found");
      return coupon.toObject();
    } catch (err) {
      if (err.name === "BSONError") {
        throw new Error("Coupon not found");
      } else {
        throw err;
      }
    }
  },
  getCouponByPromocode: async (promocode) => {
    if (typeof promocode !== "string" || !promocode.trim())
      throw new Error("Invalid promocode");
    promocode = normalizeCouponCode(promocode);
    const coupon = await CouponModel.findOne({ code: promocode });
    if (!coupon) throw new Error("Invalid promocode");
    if (coupon.status === "deactivated")
      throw new Error("This promocode is currently unavailable.");
    if (coupon.validUpto <= new Date())
      throw new Error("This promocode has expired.");
    if (coupon.validFrom > new Date())
      throw new Error("This promocode is scheduled and is not available yet.");
    return coupon.toObject();
  },
  // Validate eligibility and calculate coupon discounts for the supplied cart.
  verifyCoupon: async (promocode, cart) => {
    const coupon = await couponController.getCouponByPromocode(promocode);
    if (!cart.length) throw new Error("Your cart is empty");
    const eligible = cart.filter(
      (item) =>
        !coupon.categoryId ||
        coupon.categoryId.toString() ===
          item.productDetails.categoryId?.toString(),
    );
    if (!eligible.length)
      throw new Error(
        "This promocode is not available for the selected products",
      );
    const amount = eligible.reduce(
      (sum, item) =>
        sum +
        (item.productDetails.offerPrice || item.productDetails.price) *
          item.quantity,
      0,
    );
    if (amount < coupon.minPurchaseAmount)
      throw new Error(
        `This promocode needs a minimum purchase of ₹${coupon.minPurchaseAmount}`,
      );
    const discounts = allocateCouponDiscount(eligible, coupon);
    return {
      totalDiscount: discounts.total,
      discountsByProductId: discounts.items,
    };
  },
  editCoupon: async (couponId, data) => {
    try {
      couponId = Types.ObjectId.createFromHexString(couponId);
      const coupon = await CouponModel.findById(couponId);
      if (!coupon) throw new Error("Coupon not found");
      data = await validateCouponData(data, coupon);
      coupon.set(data);
      await coupon.save();

      const response = { message: "Coupon succesfully updated" };
      return response;
    } catch (err) {
      if (err.code === 11000)
        throw new CouponValidationError({
          code: "This coupon code already exists.",
        });
      if (err.name === "BSONError") {
        throw new Error("Coupon not found");
      } else {
        throw err;
      }
    }
  },
  updateStatus: async (couponId, status) => {
    if (!["active", "deactivated"].includes(status))
      throw new Error("Invalid coupon status");
    if (!Types.ObjectId.isValid(couponId)) throw new Error("Coupon not found");
    const filter = { _id: couponId, validUpto: { $gt: new Date() } };
    const coupon = await CouponModel.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!coupon)
      throw new Error(
        "Coupon not found or expired. Only unexpired coupons can be activated or deactivated.",
      );
    return {
      message: status === "active" ? "Coupon activated" : "Coupon deactivated",
      status,
    };
  },
  deleteCoupon: async (couponId) => {
    try {
      couponId = Types.ObjectId.createFromHexString(couponId);
      if (!(await CouponModel.findByIdAndDelete(couponId)))
        throw new Error("Coupon not found");
      const response = { message: "Coupon succesfully deleted" };
      return response;
    } catch (err) {
      if (err.name === "BSONError") {
        throw new Error("Coupon not found");
      } else {
        throw err;
      }
    }
  },
};

async function validateCouponData(data, current) {
  const values = validateCouponFields(data, current);
  values.categoryId = null;
  if (data.category) {
    if (
      typeof data.category !== "string" ||
      !Types.ObjectId.isValid(data.category) ||
      !(await CategoryModel.findById(data.category))
    )
      throw new CouponValidationError({
        category: "Selected category not found.",
      });
    values.categoryId = new Types.ObjectId(data.category);
  }
  if (
    values.code !== current?.code &&
    (await CouponModel.findOne({ code: values.code }))
  )
    throw new CouponValidationError({
      code: "This coupon code already exists.",
    });
  return values;
}

export default couponController;
