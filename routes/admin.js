import { Router } from "express";
import { createSession, withMiddleware } from "../helpers/route-helpers.js";
import * as authController from "../controller/admin/auth-controller.js";
import * as dashboardController from "../controller/admin/dashboard-controller.js";
import * as userController from "../controller/admin/user-controller.js";
import * as orderController from "../controller/admin/order-controller.js";
import * as productController from "../controller/admin/product-controller.js";
import * as categoryController from "../controller/admin/category-controller.js";
import * as couponController from "../controller/admin/coupon-controller.js";
import * as bannerController from "../controller/admin/banner-controller.js";
import { sideMenuPath } from "../helpers/admin-helpers.js";
import { checkAdminLoginStatus } from "../middleware/auth-middleware.js";
import { uploadImage } from "../middleware/file-upload-middleware.js";

const router = Router();
const authenticatedRoute = withMiddleware(router, checkAdminLoginStatus);

router.use(
  createSession({
    key: "ADMIN_SESSION",
    secret: "admin_user_secret",
    maxAge: 3600000,
  }),
);

// Routes
router
  .route("/login")
  .get(authController.showLoginForm)
  .post(authController.login);

// Authenticated routes

authenticatedRoute(sideMenuPath.dashboard).get(
  dashboardController.showDashboard,
);

authenticatedRoute("/sales-report").get(
  dashboardController.downloadSalesReport,
);

authenticatedRoute(sideMenuPath.users).get(userController.showUsersList);

authenticatedRoute(`${sideMenuPath.users}/:id/status`).patch(
  userController.toggleUserStatus,
);

// Orders routes
authenticatedRoute(sideMenuPath.orders).get(
  orderController.showOrdersList,
);

authenticatedRoute(`${sideMenuPath.orders}/:id`)
  .get(orderController.showOrderDetails)
  .patch(orderController.updateOrderStatus);

// Products routes
authenticatedRoute(sideMenuPath.products)
  .get(productController.showProductsList)
  .post(uploadImage.array("images", 5), productController.addNewProduct);

authenticatedRoute(`${sideMenuPath.products}/add`).get(
  productController.showAddProductForm,
);

authenticatedRoute(`${sideMenuPath.products}/edit/:id`).get(
  productController.showEditProductForm,
);

authenticatedRoute(`${sideMenuPath.products}/:id`).patch(
  uploadImage.array("images", 5),
  productController.editProduct,
);

// Category routes
authenticatedRoute(sideMenuPath.categories)
  .get(categoryController.showCategoryList)
  .post(uploadImage.single("image"), categoryController.createCategory);

authenticatedRoute(`${sideMenuPath.categories}/create`).get(
  categoryController.showNewCategoryForm,
);

authenticatedRoute(`${sideMenuPath.categories}/edit/:id`).get(
  categoryController.showEditCategoryForm,
);

authenticatedRoute(`${sideMenuPath.categories}/:id`)
  .patch(uploadImage.single("image"), categoryController.editCategory)
  .delete(categoryController.deleteCategory);

// Coupons
authenticatedRoute(sideMenuPath.coupons)
  .get(couponController.showCouponsList)
  .post(couponController.createCoupon);

authenticatedRoute(`${sideMenuPath.coupons}/create`).get(
  couponController.showCreateCouponForm,
);

authenticatedRoute(`${sideMenuPath.coupons}/edit/:id`).get(
  couponController.showEditCouponForm,
);

authenticatedRoute(`${sideMenuPath.coupons}/:id/status`).patch(
  couponController.updateCouponStatus,
);

authenticatedRoute(`${sideMenuPath.coupons}/:id`)
  .patch(couponController.editCoupon)
  .delete(couponController.deleteCoupon);

// Banner
authenticatedRoute(sideMenuPath.banner)
  .get(bannerController.showBannerList)
  .post(uploadImage.single("bannerImage"), bannerController.createBanner)
  .patch(uploadImage.single("bannerImage"), bannerController.updateBanner);

// Logout
router.get("/logout", authController.logout);

export default router;
