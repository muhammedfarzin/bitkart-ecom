import { Router } from "express";
import { createSession, withMiddleware } from "./helpers.js";
import adminRouterController, {
  sideMenuPath,
} from "../controller/router-controller/admin-router-controller.js";
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
  .get(adminRouterController.showLoginForm)
  .post(adminRouterController.login);

// Authenticated routes

authenticatedRoute(sideMenuPath.dashboard).get(
  adminRouterController.showDashboard,
);

authenticatedRoute("/sales-report").get(
  adminRouterController.downloadSalesReport,
);

authenticatedRoute(sideMenuPath.users).get(adminRouterController.showUsersList);

authenticatedRoute(`${sideMenuPath.users}/:id/status`).patch(
  adminRouterController.toggleUserStatus,
);

// Orders routes
authenticatedRoute(sideMenuPath.orders).get(
  adminRouterController.showOrdersList,
);

authenticatedRoute(`${sideMenuPath.orders}/:id`)
  .get(adminRouterController.showOrderDetails)
  .patch(adminRouterController.updateOrderStatus);

// Products routes
authenticatedRoute(sideMenuPath.products)
  .get(adminRouterController.showProductsList)
  .post(uploadImage.array("images", 5), adminRouterController.addNewProduct);

authenticatedRoute(`${sideMenuPath.products}/add`).get(
  adminRouterController.showAddProductForm,
);

authenticatedRoute(`${sideMenuPath.products}/edit/:id`).get(
  adminRouterController.showEditProductForm,
);

authenticatedRoute(`${sideMenuPath.products}/:id`).patch(
  uploadImage.array("images", 5),
  adminRouterController.editProduct,
);

// Category routes
authenticatedRoute(sideMenuPath.categories)
  .get(adminRouterController.showCategoryList)
  .post(uploadImage.single("image"), adminRouterController.createCategory);

authenticatedRoute(`${sideMenuPath.categories}/create`).get(
  adminRouterController.showNewCategoryForm,
);

authenticatedRoute(`${sideMenuPath.categories}/edit/:id`).get(
  adminRouterController.showEditCategoryForm,
);

authenticatedRoute(`${sideMenuPath.categories}/:id`)
  .patch(uploadImage.single("image"), adminRouterController.editCategory)
  .delete(adminRouterController.deleteCategory);

// Coupons
authenticatedRoute(sideMenuPath.coupons)
  .get(adminRouterController.showCouponsList)
  .post(adminRouterController.createCoupon);

authenticatedRoute(`${sideMenuPath.coupons}/create`).get(
  adminRouterController.showCreateCouponForm,
);

authenticatedRoute(`${sideMenuPath.coupons}/edit/:id`).get(
  adminRouterController.showEditCouponForm,
);

authenticatedRoute(`${sideMenuPath.coupons}/:id`)
  .patch(adminRouterController.editCoupon)
  .delete(adminRouterController.deleteCoupon);

// Banner
authenticatedRoute(sideMenuPath.banner)
  .get(adminRouterController.showBannerList)
  .post(uploadImage.single("bannerImage"), adminRouterController.createBanner)
  .patch(uploadImage.single("bannerImage"), adminRouterController.updateBanner);

// Logout
router.get("/logout", adminRouterController.logout);

router.all("*", adminRouterController.pageNotFound);

export default router;
