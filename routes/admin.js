import { Router } from "express";
import { createSession, withMiddleware } from "./helpers.js";
import * as adminController from "../controller/admin-controller.js";
import { sideMenuPath } from "../controller/admin-controller.js";
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
  .get(adminController.showLoginForm)
  .post(adminController.login);

// Authenticated routes

authenticatedRoute(sideMenuPath.dashboard).get(
  adminController.showDashboard,
);

authenticatedRoute("/sales-report").get(
  adminController.downloadSalesReport,
);

authenticatedRoute(sideMenuPath.users).get(adminController.showUsersList);

authenticatedRoute(`${sideMenuPath.users}/:id/status`).patch(
  adminController.toggleUserStatus,
);

// Orders routes
authenticatedRoute(sideMenuPath.orders).get(
  adminController.showOrdersList,
);

authenticatedRoute(`${sideMenuPath.orders}/:id`)
  .get(adminController.showOrderDetails)
  .patch(adminController.updateOrderStatus);

// Products routes
authenticatedRoute(sideMenuPath.products)
  .get(adminController.showProductsList)
  .post(uploadImage.array("images", 5), adminController.addNewProduct);

authenticatedRoute(`${sideMenuPath.products}/add`).get(
  adminController.showAddProductForm,
);

authenticatedRoute(`${sideMenuPath.products}/edit/:id`).get(
  adminController.showEditProductForm,
);

authenticatedRoute(`${sideMenuPath.products}/:id`).patch(
  uploadImage.array("images", 5),
  adminController.editProduct,
);

// Category routes
authenticatedRoute(sideMenuPath.categories)
  .get(adminController.showCategoryList)
  .post(uploadImage.single("image"), adminController.createCategory);

authenticatedRoute(`${sideMenuPath.categories}/create`).get(
  adminController.showNewCategoryForm,
);

authenticatedRoute(`${sideMenuPath.categories}/edit/:id`).get(
  adminController.showEditCategoryForm,
);

authenticatedRoute(`${sideMenuPath.categories}/:id`)
  .patch(uploadImage.single("image"), adminController.editCategory)
  .delete(adminController.deleteCategory);

// Coupons
authenticatedRoute(sideMenuPath.coupons)
  .get(adminController.showCouponsList)
  .post(adminController.createCoupon);

authenticatedRoute(`${sideMenuPath.coupons}/create`).get(
  adminController.showCreateCouponForm,
);

authenticatedRoute(`${sideMenuPath.coupons}/edit/:id`).get(
  adminController.showEditCouponForm,
);

authenticatedRoute(`${sideMenuPath.coupons}/:id/status`).patch(
  adminController.updateCouponStatus,
);

authenticatedRoute(`${sideMenuPath.coupons}/:id`)
  .patch(adminController.editCoupon)
  .delete(adminController.deleteCoupon);

// Banner
authenticatedRoute(sideMenuPath.banner)
  .get(adminController.showBannerList)
  .post(uploadImage.single("bannerImage"), adminController.createBanner)
  .patch(uploadImage.single("bannerImage"), adminController.updateBanner);

// Logout
router.get("/logout", adminController.logout);

router.all("*", adminController.pageNotFound);

export default router;
