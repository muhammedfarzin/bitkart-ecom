import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import adminRouterController, { sideMenuPath } from "../controller/router-controller/admin-router-controller.js";
import { checkAdminLoginStatus } from "../middleware/auth-middleware.js";
import { uploadImage } from "../middleware/file-upload-middleware.js";

const router = Router();
const MongoStore = MongoDBStore(session);

const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions',
});

sessionStore.on('error', (error) => console.error('Session store error:', error));

router.use(session({
    key: 'ADMIN_SESSION',
    secret: 'admin_user_secret',
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
    cookie: {
        maxAge: 3600000  // 1 Hour
    }
}));

// Routes
router.get('/login', adminRouterController.showLoginForm);

router.post('/login', adminRouterController.login);

// Routes needs authorization

router.get(sideMenuPath.dashboard, checkAdminLoginStatus, adminRouterController.showDashboard);

router.get('/downloadSalesReport', checkAdminLoginStatus, adminRouterController.downloadSalesReport);

router.get(sideMenuPath.users, checkAdminLoginStatus, adminRouterController.showUsersList);

router.patch(`${sideMenuPath.users}/toggleStatus`, checkAdminLoginStatus, adminRouterController.toggleUserStatus);

// Orders routes
router.get(sideMenuPath.orders, checkAdminLoginStatus, adminRouterController.showOrdersList);

router.get(`${sideMenuPath.orders}/:id`, checkAdminLoginStatus, adminRouterController.showOrderDetails);

router.post(`${sideMenuPath.orders}/:id/updateStatus`, checkAdminLoginStatus, adminRouterController.updateOrderStatus);

// Products routes
router.get(sideMenuPath.products, checkAdminLoginStatus, adminRouterController.showProductsList);

router.get(`${sideMenuPath.products}/add`, checkAdminLoginStatus, adminRouterController.showAddProductForm);

router.post(`${sideMenuPath.products}/add`, checkAdminLoginStatus, uploadImage.array('images', 5), adminRouterController.addNewProduct);

router.get(`${sideMenuPath.products}/edit/:id`, checkAdminLoginStatus, adminRouterController.showEditProductForm);

router.post(`${sideMenuPath.products}/edit/:id`, checkAdminLoginStatus, uploadImage.array('images', 5), adminRouterController.editProduct);

// Category routes
router.get(sideMenuPath.categories, checkAdminLoginStatus, adminRouterController.showCategoryList);

router.get(`${sideMenuPath.categories}/create`, checkAdminLoginStatus, adminRouterController.showNewCategoryForm);

router.post(`${sideMenuPath.categories}/create`, checkAdminLoginStatus, uploadImage.single('image'), adminRouterController.createCategory);

router.get(`${sideMenuPath.categories}/edit/:id`, checkAdminLoginStatus, adminRouterController.showEditCategoryForm);

router.post(`${sideMenuPath.categories}/edit/:id`, checkAdminLoginStatus, uploadImage.single('image'), adminRouterController.editCategory);

router.delete(`${sideMenuPath.categories}/delete`, checkAdminLoginStatus, adminRouterController.deleteCategory);

// Coupons
router.get(`${sideMenuPath.coupons}`, checkAdminLoginStatus, adminRouterController.showCouponsList);

router.get(`${sideMenuPath.coupons}/create`, checkAdminLoginStatus, adminRouterController.showCreateCouponForm);

router.post(`${sideMenuPath.coupons}/create`, checkAdminLoginStatus, adminRouterController.createCoupon);

router.get(`${sideMenuPath.coupons}/edit/:id`, checkAdminLoginStatus, adminRouterController.showEditCouponForm);

router.post(`${sideMenuPath.coupons}/edit/:id`, checkAdminLoginStatus, adminRouterController.editCoupon);

router.delete(`${sideMenuPath.coupons}/remove/:id`, checkAdminLoginStatus, adminRouterController.deleteCoupon);

// Banner
router.get(`${sideMenuPath.banner}`, checkAdminLoginStatus, adminRouterController.showBannerList);

router.post(`${sideMenuPath.banner}/create`, uploadImage.single('bannerImage'), checkAdminLoginStatus, adminRouterController.createBanner);

router.post(`${sideMenuPath.banner}/update`, uploadImage.single('bannerImage'), checkAdminLoginStatus, adminRouterController.updateBanner);

// Logout
router.get('/logout', adminRouterController.logout);

router.all('*', adminRouterController.pageNotFound)


export default router;