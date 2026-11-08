import { allocateCouponDiscount } from "../helpers/coupon-discount.js";
import { Types } from "mongoose";
import CategoryModel from "../models/category-model.js";
import CouponModel from "../models/coupon-model.js";

const couponController = {
  createCoupon: async (data) => {
    try {
      data = await validateCouponData(data);
      const {
        code,
        title,
        description,
        validUpto,
        categoryId,
        discountValue,
        discountType,
        minPurchaseAmount,
        maxDiscountAmount,
      } = data;

      const coupon = new CouponModel({
        code: code.replace(/\s/, "").toUpperCase(),
        title,
        description,
        categoryId,
        validUpto,
        discountValue,
        discountType,
        minPurchaseAmount,
        maxDiscountAmount,
      });
      await coupon.save();

      const response = { message: "Coupon created successfully" };
      return response;
    } catch (err) {
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
    else if (status === "active" || status === "expired") {
      filter.status = { $ne: "deactivated" };
      filter.validUpto = status === "active" ? { $gt: now } : { $lte: now };
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
      displayStatus:
        coupon.status === "deactivated"
          ? "Deactivated"
          : coupon.validUpto <= now
            ? "Expired"
            : "Active",
    }));
  },
  getCouponById: async (couponId) => {
    try {
      couponId = Types.ObjectId.createFromHexString(couponId);
      const coupon = await CouponModel.findById(couponId);
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
    promocode = promocode.replace(/\s/g, "").toUpperCase();
    const coupon = await CouponModel.findOne({ code: promocode });
    if (!coupon) throw new Error("Invalid promocode");
    if (coupon.status === "deactivated")
      throw new Error("This promocode is currently unavailable.");
    if (coupon.validUpto <= new Date())
      throw new Error("This promocode has expired.");
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
      data = await validateCouponData(data, coupon.code, coupon.validUpto);
      let {
        code,
        title,
        description,
        validUpto,
        categoryId,
        discountValue,
        discountType,
        minPurchaseAmount,
        maxDiscountAmount,
      } = data;

      await coupon.updateOne({
        code,
        title,
        description,
        categoryId,
        validUpto,
        discountValue,
        discountType,
        minPurchaseAmount,
        maxDiscountAmount,
      });

      const response = { message: "Coupon succesfully updated" };
      return response;
    } catch (err) {
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
      await CouponModel.findByIdAndDelete(couponId);
      const response = { message: "Coupon succesfully deleted" };
      return response;
    } catch (err) {
      if (err.name === "BSONError") {
        throw new Error("Selected category not found");
      } else {
        throw err;
      }
    }
  },
};

async function validateCouponData(data, currentCouponCode, currentExpiry) {
  let {
    code,
    title,
    description,
    validUpto,
    category,
    discountValue,
    discountType,
    minPurchaseAmount,
    maxDiscountAmount,
  } = data;
  let categoryId;

  if (
    (!code || !title || !description,
    !validUpto,
    !discountValue,
    !discountType,
    !minPurchaseAmount,
    !maxDiscountAmount)
  ) {
    throw new Error("Please fill complete form");
  }

  if (category) {
    categoryId = Types.ObjectId.createFromHexString(category);
    const categoryData = await CategoryModel.findById(categoryId);
    if (!categoryData) throw new Error("Selected category not found");
  }

  code = code.replace(/\s/, "").toUpperCase();
  if (currentCouponCode != code) {
    const existCoupon = await CouponModel.findOne({ code });
    if (existCoupon) throw new Error("The coupon code is already exist");
  }

  validUpto = new Date(validUpto);
  if (!Number.isFinite(validUpto.getTime()))
    throw new Error("Invalid expiry date");
  const unchangedExpiry =
    currentExpiry &&
    validUpto.toISOString().slice(0, 10) ===
      new Date(currentExpiry).toISOString().slice(0, 10);
  if (validUpto <= Date.now() && !unchangedExpiry)
    throw new Error("Valid upto date cannot be past");
  if (unchangedExpiry) validUpto = currentExpiry;

  if (discountValue < 1)
    throw new Error("Discount value cannot be less than 1");
  else if (minPurchaseAmount < 1)
    throw new Error("Minimum purchase amount cannot be less than 1");
  else if (maxDiscountAmount < 1)
    throw new Error("Maximum purchase amount cannot be less than 1");

  const response = {
    code,
    title,
    description,
    validUpto,
    categoryId,
    discountValue,
    discountType,
    minPurchaseAmount,
    maxDiscountAmount,
  };
  return response;
}

export default couponController;
