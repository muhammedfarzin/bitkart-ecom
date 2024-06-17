import { Router } from "express";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import adminRouterController, { checkLoginStatus, upload, sideMenuPath } from "../controller/router-controller/admin-router-controller.js";

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

router.get(sideMenuPath.dashboard, checkLoginStatus, adminRouterController.showDashboard);

router.get('/downloadSalesReport', checkLoginStatus, adminRouterController.downloadSalesReport);

router.get(sideMenuPath.users, checkLoginStatus, adminRouterController.showUsersList);

router.patch(`${sideMenuPath.users}/toggleStatus`, checkLoginStatus, adminRouterController.toggleUserStatus);

// Orders routes
router.get(sideMenuPath.orders, checkLoginStatus, adminRouterController.showOrdersList);

router.get(`${sideMenuPath.orders}/:id`, checkLoginStatus, adminRouterController.showOrderDetails);

router.post(`${sideMenuPath.orders}/:id/updateStatus`, checkLoginStatus, adminRouterController.updateOrderStatus);

// Products routes
router.get(sideMenuPath.products, checkLoginStatus, adminRouterController.showProductsList);

router.get(`${sideMenuPath.products}/add`, checkLoginStatus, adminRouterController.showAddProductForm);

router.post(`${sideMenuPath.products}/add`, checkLoginStatus, upload.array('images', 5), adminRouterController.addNewProduct);

router.get(`${sideMenuPath.products}/edit/:id`, checkLoginStatus, adminRouterController.showEditProductForm);

router.post(`${sideMenuPath.products}/edit/:id`, checkLoginStatus, upload.array('images', 5), adminRouterController.editProduct);

// Category routes
router.get(sideMenuPath.categories, checkLoginStatus, adminRouterController.showCategoryList);

router.get(`${sideMenuPath.categories}/create`, checkLoginStatus, adminRouterController.showNewCategoryForm);

router.post(`${sideMenuPath.categories}/create`, checkLoginStatus, upload.single('image'), adminRouterController.createCategory);

router.get(`${sideMenuPath.categories}/edit/:id`, checkLoginStatus, adminRouterController.showEditCategoryForm);

router.post(`${sideMenuPath.categories}/edit/:id`, checkLoginStatus, upload.single('image'), adminRouterController.editCategory);

router.delete(`${sideMenuPath.categories}/delete`, checkLoginStatus, adminRouterController.deleteCategory);

// Coupons
router.get(`${sideMenuPath.coupons}`, checkLoginStatus, adminRouterController.showCouponsList);

router.get(`${sideMenuPath.coupons}/create`, checkLoginStatus, adminRouterController.showCreateCouponForm);

router.post(`${sideMenuPath.coupons}/create`, checkLoginStatus, adminRouterController.createCoupon);

// Logout
router.get('/logout', adminRouterController.logout);

router.all('*', adminRouterController.pageNotFound)


export default router;