import path from "path";
import multer from "multer";
import userController from "../user-controller.js";
import categoryController from "../category-controller.js";
import productController from "../product-controller.js";
import orderController from "../order-controller.js";
import couponController from "../coupon-controller.js";

export const sideMenuPath = {
    dashboard: '/',
    users: '/users',
    orders: '/orders',
    products: '/products',
    categories: '/categories',
    coupons: '/coupons',
    banner: '/banner'
};

const dashboardRoute = '/admin';
const loginRoute = '/admin/login';

const adminRouterController = {
    // Authentications
    showLoginForm: (req, res) => {
        if (checkLogin(req.session)) {
            res.redirect(dashboardRoute);
        } else {
            res.render('admin/login', { title: "Admin Login" });
        }
    },
    login: (req, res) => {
        if (checkLogin(req.session)) {
            return res.redirect(dashboardRoute);
        }
        const { email, password } = req.body;
        if (email == process.env.ADMIN_EMAIL && password == process.env.ADMIN_PASSWORD) {
            req.session.admin = email
            req.session.save();
            res.redirect(dashboardRoute);
        } else {
            res.status(401).render('admin/login', { errMessage: 'Invalid username or password' });
        }
    },
    logout: (req, res) => {
        req.session.destroy();
        res.redirect(loginRoute);
    },

    // Dashboard
    showDashboard: async (req, res) => {
        try {
            const salesReport = await orderController.getSalesReport(req.query);
            const topProducts = await orderController.getTopSellingProducts(3, req.query);
            const sideMenus = getSideMenus(sideMenuPath.dashboard);
            let downloadUrl = new URL(req.originalUrl, req.protocol + '://' + req.get('host'));
            downloadUrl.pathname = '/admin/downloadSalesReport';
            res.render('admin/index', { salesReport, topProducts, sideMenus, downloadUrl, duration: req.query.duration });
        } catch (err) {
            res.status(400).render('admin/error', { errMessage: err.message });
        }
    },

    downloadSalesReport: async (req, res) => {
        if (req.query.fileType == 'excel') {
            const salesReportExcelBuffer = await orderController.getSalesReportExcel(req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument');
            res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
            res.send(salesReportExcelBuffer);
        } else {
            const salesReportPdfBuffer = await orderController.getSalesReportPdf(req.query);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
            res.send(salesReportPdfBuffer);
        }
    },

    // Users
    showUsersList: async (req, res) => {
        let users, searchQuery = req.query.search;
        if (searchQuery) {
            users = await userController.findUsersByQuery(searchQuery);
        } else {
            users = await userController.getUsersBasicData();
        }
        const sideMenus = getSideMenus(sideMenuPath.users);
        res.render('admin/users/users', { users, sideMenus, searchQuery });
    },
    toggleUserStatus: async (req, res) => {
        try {
            const response = await userController.toggleUserStatus(req.body.userId);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },

    // Orders
    showOrdersList: async (req, res) => {
        const orders = await orderController.getOrders();
        const sideMenus = getSideMenus(sideMenuPath.orders);
        res.render('admin/orders/orders', { orders, sideMenus });
    },
    showOrderDetails: async (req, res) => {
        try {
            const order = await orderController.getOrderById(req.params.id);
            const sideMenus = getSideMenus(sideMenuPath.orders);
            res.render('admin/orders/view-order', { order, sideMenus, currentPath: req.urls });
        } catch (err) {
            res.render('admin/error', { errMessage: err.message });
        }
    },
    updateOrderStatus: async (req, res) => {
        try {
            const orderId = req.params.id;
            const response = await orderController.updateStatus(orderId, req.body.status);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },

    // Products
    showProductsList: async (req, res) => {
        let products;
        if (req.query.search) {
            products = await productController.searchProducts(req.query.search);
        } else {
            products = await productController.getProducts();
        }
        const sideMenus = getSideMenus(sideMenuPath.products);
        res.render('admin/products/products', ({ products, sideMenus, searchQuery: req.query.search }));
    },
    showAddProductForm: async (req, res) => {
        const categories = await categoryController.getAllCategoryTitles();
        const sideMenus = getSideMenus();
        res.render('admin/products/products-form', ({ categories, sideMenus, errMessage: req.query.errMessage }));
    },
    addNewProduct: async (req, res) => {
        try {
            await productController.addProduct(req);
            res.redirect(dashboardRoute + sideMenuPath.products);
        } catch (err) {
            res.redirect(`${dashboardRoute}${req.path}?errMessage=${err.message}`);
        }
    },
    showEditProductForm: async (req, res) => {
        try {
            const product = await productController.getProductById(req.params.id);
            const categories = await categoryController.getAllCategoryTitles();
            const sideMenus = getSideMenus();
            res.render('admin/products/products-form', { product, categories, sideMenus, errMessage: req.query.errMessage });
        } catch (err) {
            res.render('admin/error', { errMessage: err.message })
        }
    },
    editProduct: async (req, res) => {
        try {
            await productController.updateProduct(req.params.id, req);
            res.redirect(dashboardRoute + sideMenuPath.products);
        } catch (err) {
            res.redirect(`${dashboardRoute + req.path}?errMessage=${err.message}`);
        }
    },

    // Categories
    showCategoryList: async (req, res) => {
        let categories;
        if (req.query.search) {
            categories = await categoryController.searchCategories(req.query.search);
        } else {
            categories = await categoryController.getCategories();
        }
        const sideMenus = getSideMenus(sideMenuPath.categories);
        res.render('admin/categories/categories', ({ categories, sideMenus, searchQuery: req.query.search }));
    },
    showNewCategoryForm: (req, res) => {
        const sideMenus = getSideMenus();
        res.render('admin/categories/category-form', ({ sideMenus }));
    },
    createCategory: async (req, res) => {
        try {
            if (!req.file) {
                throw new Error('Please upload category image');
            }
            await categoryController.createCategory(req);
            res.redirect(dashboardRoute + sideMenuPath.categories);
        } catch (err) {
            const sideMenus = getSideMenus();
            return res.render('admin/categories/category-form', ({ sideMenus, errMessage: err.message }));
        }
    },
    showEditCategoryForm: async (req, res) => {
        try {
            const category = await categoryController.getCategoryById(req.params.id);
            const products = await productController.getProductsByCategory(req.params.id);
            const sideMenus = getSideMenus();
            res.render('admin/categories/category-form', ({ category, products, sideMenus, errMessage: req.query.errMessage }));
        } catch (err) {
            res.render('admin/error', { errMessage: err.message });
        }
    },
    editCategory: async (req, res) => {
        try {
            await categoryController.updateCategory(req.params.id, req);
            res.redirect(dashboardRoute + sideMenuPath.categories);
        } catch (err) {
            res.redirect(`${dashboardRoute}${req.path}?errMessage=${err.message}`);
        }
    },
    deleteCategory: async (req, res) => {
        try {
            const response = await categoryController.deleteCategory(req.body.categoryId);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: 'Invalid category' });
        }
    },

    // Coupons
    showCouponsList: async (req, res) => {
        const coupons = await couponController.getAllCoupons(20);
        const sideMenus = getSideMenus(sideMenuPath.coupons);
        res.render('admin/coupons/coupons-list', { coupons, sideMenus });
    },
    showCreateCouponForm: async (req, res) => {
        const categories = await categoryController.getAllCategoryTitles();
        const sideMenus = getSideMenus();
        res.render('admin/coupons/coupons-form', { categories, sideMenus, errMessage: req.query.errMessage });
    },
    createCoupon: async (req, res) => {
        try {
            await couponController.createCoupon(req.body);
            res.redirect(`/admin${sideMenuPath.coupons}`);
        } catch (err) {
            const url = new URL(req.originalUrl, req.protocol + '://' + req.get('host'));
            url.searchParams.set('errMessage', err.message);
            res.redirect(url);
        }
    },
    showEditCouponForm: async (req, res) => {
        const coupon = await couponController.getCouponById(req.params.id);
        const categories = await categoryController.getAllCategoryTitles();
        const sideMenus = getSideMenus();
        res.render('admin/coupons/coupons-form', { coupon, categories, sideMenus, errMessage: req.query.errMessage });
    },
    editCoupon: async (req, res) => {
        try {
            await couponController.editCoupon(req.params.id, req.body);
            res.redirect(`/admin${sideMenuPath.coupons}`);
        } catch (err) {
            const url = new URL(req.originalUrl, req.protocol + '://' + req.get('host'));
            url.searchParams.set('errMessage', err.message);
            res.redirect(url);
        }
    },
    deleteCoupon: async (req, res) => {
        try {
            const response = await couponController.deleteCoupon(req.params.id);
            res.json(response);
        } catch (err) {
            res.status(400).json({ errMessage: err.message });
        }
    },

    // 404
    pageNotFound: (req, res) => {
        return res.render('admin/404');
    }
}

function getSideMenus(pathName) {
    return Object.keys(sideMenuPath).map(title => {
        return {
            title,
            path: dashboardRoute + sideMenuPath[title],
            active: sideMenuPath[title] == pathName
        };
    })
};


function checkLogin(session) {
    if (session.admin && session.admin == process.env.ADMIN_EMAIL) {
        return true;
    } else {
        return false;
    }
};

export function checkLoginStatus(req, res, next) {
    if (checkLogin(req.session)) {
        next();
    } else {
        req.session.destroy();
        res.redirect(loginRoute);
    }
}

export const upload = multer({
    storage: multer.diskStorage({
        destination: './public/images/uploads/',
        filename: (req, file, cb) => {
            const randomNumber = Math.floor(Math.random() * 90000) + 10000;
            cb(null, file.fieldname + Date.now() + randomNumber + path.extname(file.originalname));
        }
    })
})

export default adminRouterController;