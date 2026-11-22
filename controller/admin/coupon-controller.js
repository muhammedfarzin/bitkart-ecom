import { couponDate, couponTime } from "../../helpers/coupon-validation.js";
import * as categoryService from "../../services/category-service.js";
import * as couponService from "../../services/coupon-service.js";
import { sideMenuPath, statusOptions, filterOptions, getSideMenus } from "../../helpers/admin-helpers.js";

export const showCouponsList = async (req, res) => {
  const status = ["active", "scheduled", "expired", "deactivated"].includes(
    req.query.status,
  )
    ? req.query.status
    : "all";
  const searchQuery =
    typeof req.query.search === "string" ? req.query.search : "";
  const coupons = await couponService.getAllCoupons(20, status, searchQuery);
  const sideMenus = getSideMenus(sideMenuPath.coupons);
  res.render("admin/coupons/coupons-list", {
    coupons,
    sideMenus,
    selectedStatus: status,
    successMessage:
      req.query.saved === "created"
        ? "Coupon created successfully."
        : req.query.saved === "updated"
          ? "Coupon updated successfully."
          : "",
    statusOptions: filterOptions("coupons"),
    searchQuery,
  });
};

export const showCreateCouponForm = async (req, res) => {
  res.render("admin/coupons/coupons-form", {
    categories: await categoryService.getAllCategoryTitles(),
    sideMenus: getSideMenus(sideMenuPath.coupons),
    values: {
      startOption: "today",
      validFrom: couponDate(),
      validUpto: couponDate(),
      discountType: "flat",
      status: "active",
    },
  });
};

export const createCoupon = async (req, res) => {
  try {
    await couponService.createCoupon(req.body);
    res.redirect(303, "/admin/coupons?saved=created");
  } catch (err) {
    res.status(422).json({
      errMessage: err.errors
        ? err.message
        : "Unable to create coupon. Please try again.",
      errors: err.errors || {},
    });
  }
};

export const showEditCouponForm = async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);
  res.render("admin/coupons/coupons-form", {
    coupon,
    values: {
      ...coupon,
      schedule: coupon.validFrom > new Date(),
      category: coupon.categoryId?.toString() || "",
      startOption: coupon.validFrom || coupon.createdAt ? "pick" : "today",
      validFrom:
        coupon.validFrom || coupon.createdAt
          ? couponDate(coupon.validFrom || coupon.createdAt)
          : couponDate(),
      startTime:
        coupon.validFrom > new Date() ? couponTime(coupon.validFrom) : "",
      validUpto: couponDate(coupon.validUpto),
      status: coupon.status || "active",
    },
    categories: await categoryService.getAllCategoryTitles(),
    sideMenus: getSideMenus(sideMenuPath.coupons),
  });
};

export const editCoupon = async (req, res) => {
  try {
    await couponService.editCoupon(req.params.id, req.body);
    res.redirect(303, "/admin/coupons?saved=updated");
  } catch (err) {
    res.status(422).json({
      errMessage: err.errors
        ? err.message
        : "Unable to update coupon. It may have been removed. Please try again.",
      errors: err.errors || {},
    });
  }
};

export const updateCouponStatus = async (req, res) => {
  try {
    res.json(await couponService.updateStatus(req.params.id, req.body.status));
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const response = await couponService.deleteCoupon(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};
