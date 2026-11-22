import { couponDate, couponTime } from "../helpers/coupon-validation.js";
import * as userService from "../services/user-service.js";
import * as categoryService from "../services/category-service.js";
import * as productService from "../services/product-service.js";
import * as orderService from "../services/order-service.js";
import * as couponService from "../services/coupon-service.js";
import { checkLogin } from "../middleware/auth-middleware.js";
import * as bannerService from "../services/banner-service.js";

export const sideMenuPath = {
  dashboard: "/",
  users: "/users",
  orders: "/orders",
  products: "/products",
  categories: "/categories",
  coupons: "/coupons",
  banner: "/banner",
};

const statusOptions = {
  users: ["active", "blocked"],
  products: ["active", "sold out"],
  orders: ["confirmed", "shipped", "delivered", "cancelled", "return"],
  coupons: ["active", "scheduled", "expired", "deactivated"],
};
const filterOptions = (type) =>
  statusOptions[type].map((value) => ({
    value,
    label:
      value === "return"
        ? "Returned"
        : value.charAt(0).toUpperCase() + value.slice(1),
  }));
const dashboardRoute = "/admin";
const loginRoute = "/admin/login";

// Authentications

export const showLoginForm = (req, res) => {
  if (checkLogin(req.session)) {
    res.redirect(303, dashboardRoute);
  } else {
    res.render("admin/login", { title: "Admin Login" });
  }
};

export const login = (req, res) => {
  if (checkLogin(req.session)) {
    return res.redirect(303, dashboardRoute);
  }
  const { email, password } = req.body;
  if (
    email == process.env.ADMIN_EMAIL &&
    password == process.env.ADMIN_PASSWORD
  ) {
    req.session.admin = email;
    req.session.save();
    res.redirect(303, dashboardRoute);
  } else {
    res
      .status(401)
      .render("admin/login", { errMessage: "Invalid username or password" });
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  res.redirect(303, loginRoute);
};

// Dashboard

export const showDashboard = async (req, res) => {
  try {
    const salesReport = await orderService.getSalesReport(req.query);
    const topProducts = await orderService.getTopSellingProducts(3, req.query);
    const sideMenus = getSideMenus(sideMenuPath.dashboard);
    let downloadUrl = new URL(
      req.originalUrl,
      req.protocol + "://" + req.get("host"),
    );
    downloadUrl.pathname = "/admin/sales-report";
    res.render("admin/index", {
      salesReport,
      topProducts,
      sideMenus,
      downloadUrl,
      duration: req.query.duration,
    });
  } catch (err) {
    res.status(400).render("admin/error", { errMessage: err.message });
  }
};

export const downloadSalesReport = async (req, res) => {
  if (req.query.fileType == "excel") {
    const salesReportExcelBuffer = await orderService.getSalesReportExcel(
      req.query,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.xlsx"',
    );
    res.send(salesReportExcelBuffer);
  } else {
    const salesReportPdfBuffer = await orderService.getSalesReportPdf(
      req.query,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.pdf"',
    );
    res.send(salesReportPdfBuffer);
  }
};

// Users

export const showUsersList = async (req, res) => {
  let users,
    searchQuery = req.query.search;
  const status = ["active", "blocked"].includes(req.query.status)
    ? req.query.status
    : "all";
  const filter = status === "all" ? {} : { status };
  if (searchQuery) {
    users = await userService.findUsersByQuery(searchQuery, filter);
  } else {
    users = await userService.getUsersBasicData(filter);
  }
  const sideMenus = getSideMenus(sideMenuPath.users);
  res.render("admin/users/users", {
    users,
    sideMenus,
    searchQuery,
    selectedStatus: status,
    statusOptions: filterOptions("users"),
  });
};

export const toggleUserStatus = async (req, res) => {
  try {
    const response = await userService.toggleUserStatus(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};

// Orders

export const showOrdersList = async (req, res) => {
  const status = [
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "return",
  ].includes(req.query.status)
    ? req.query.status
    : "all";
  const orders = await orderService.getOrders(status);
  const sideMenus = getSideMenus(sideMenuPath.orders);
  res.render("admin/orders/orders", {
    orders,
    sideMenus,
    selectedStatus: status,
    statusOptions: filterOptions("orders"),
  });
};

export const showOrderDetails = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    const sideMenus = getSideMenus(sideMenuPath.orders);
    res.render("admin/orders/view-order", {
      order,
      sideMenus,
      currentPath: req.urls,
    });
  } catch (err) {
    res.render("admin/error", { errMessage: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const response = await orderService.updateStatus(orderId, req.body.status);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};

// Products

export const showProductsList = async (req, res) => {
  let products;
  const status = statusOptions.products.includes(req.query.status)
    ? req.query.status
    : "all";
  const filter = status === "all" ? {} : { status };
  if (req.query.search) {
    products = await productService.searchProducts(req.query.search, filter);
  } else {
    products = await productService.getProducts(filter);
  }
  const sideMenus = getSideMenus(sideMenuPath.products);
  res.render("admin/products/products", {
    products,
    sideMenus,
    searchQuery: req.query.search,
    selectedStatus: status,
    statusOptions: filterOptions("products"),
  });
};

export const showAddProductForm = async (req, res) => {
  const categories = await categoryService.getAllCategoryTitles();
  const sideMenus = getSideMenus();
  res.render("admin/products/products-form", {
    categories,
    sideMenus,
    errMessage: req.query.errMessage,
  });
};

export const addNewProduct = async (req, res) => {
  try {
    await productService.addProduct(req);
    res.redirect(303, dashboardRoute + sideMenuPath.products);
  } catch (err) {
    res.redirect(
      303,
      `/admin/products/add?errMessage=${encodeURIComponent(err.message)}`,
    );
  }
};

export const showEditProductForm = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    const categories = await categoryService.getAllCategoryTitles();
    const sideMenus = getSideMenus();
    res.render("admin/products/products-form", {
      product,
      categories,
      sideMenus,
      errMessage: req.query.errMessage,
    });
  } catch (err) {
    res.render("admin/error", { errMessage: err.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    await productService.updateProduct(req.params.id, req);
    res.redirect(303, dashboardRoute + sideMenuPath.products);
  } catch (err) {
    res.redirect(
      303,
      `/admin/products/edit/${req.params.id}?errMessage=${encodeURIComponent(err.message)}`,
    );
  }
};

// Categories

export const showCategoryList = async (req, res) => {
  let categories;
  if (req.query.search) {
    categories = await categoryService.searchCategories(req.query.search);
  } else {
    categories = await categoryService.getCategories();
  }
  const sideMenus = getSideMenus(sideMenuPath.categories);
  res.render("admin/categories/categories", {
    categories,
    sideMenus,
    searchQuery: req.query.search,
  });
};

export const showNewCategoryForm = (req, res) => {
  const sideMenus = getSideMenus();
  res.render("admin/categories/category-form", { sideMenus });
};

export const createCategory = async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Please upload category image");
    }
    await categoryService.createCategory(req);
    res.redirect(303, dashboardRoute + sideMenuPath.categories);
  } catch (err) {
    const sideMenus = getSideMenus();
    return res.render("admin/categories/category-form", {
      sideMenus,
      errMessage: err.message,
    });
  }
};

export const showEditCategoryForm = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    const products = await productService.getProductsByCategory(req.params.id);
    const sideMenus = getSideMenus();
    res.render("admin/categories/category-form", {
      category,
      products,
      sideMenus,
      errMessage: req.query.errMessage,
    });
  } catch (err) {
    res.render("admin/error", { errMessage: err.message });
  }
};

export const editCategory = async (req, res) => {
  try {
    await categoryService.updateCategory(req.params.id, req);
    res.redirect(303, dashboardRoute + sideMenuPath.categories);
  } catch (err) {
    res.redirect(
      303,
      `/admin/categories/edit/${req.params.id}?errMessage=${encodeURIComponent(err.message)}`,
    );
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const response = await categoryService.deleteCategory(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(400).json({ errMessage: "Invalid category" });
  }
};

// Coupons

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

// Banner

export const showBannerList = async (req, res) => {
  const banners = await bannerService.getBanners();
  const sideMenus = getSideMenus(sideMenuPath.banner);
  res.render("admin/banner/banner-list", { banners, sideMenus });
};

export const createBanner = async (req, res) => {
  await bannerService.createBanner(req);
  res.redirect(303, dashboardRoute + sideMenuPath.banner);
};

export const updateBanner = async (req, res) => {
  await bannerService.updateBanner(req);
  res.redirect(303, dashboardRoute + sideMenuPath.banner);
};

// 404

export const pageNotFound = (req, res) => {
  return res.render("admin/404");
};

function getSideMenus(pathName) {
  return Object.keys(sideMenuPath).map((title) => {
    return {
      title,
      path: dashboardRoute + sideMenuPath[title],
      active: sideMenuPath[title] == pathName,
    };
  });
}
