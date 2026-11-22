import { Schema, Types, model } from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z0-9_-]{1,32}$/,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      required: true,
    },
    discountValue: {
      type: Number,
      validate: {
        validator: function (value) {
          return (
            Number.isFinite(value) &&
            value <= 1000000000 &&
            (this.discountType !== "percentage" || value <= 100)
          );
        },
        message: "Invalid discount value",
      },
      required: true,
      min: 1,
    },
    discountType: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return /^(flat|percentage)$/.test(value);
        },
        message: 'Discount type must be either "flat" or "percentage"',
      },
    },
    status: {
      type: String,
      enum: ["active", "deactivated"],
      default: "active",
    },
    categoryId: Types.ObjectId,
    validFrom: { type: Date },
    validUpto: {
      type: Date,
      required: true,
    },
    minPurchaseAmount: {
      type: Number,
      required: true,
      min: 10,
    },
    maxDiscountAmount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

const CouponModel = model("coupon", couponSchema, "coupons");

export default CouponModel;
