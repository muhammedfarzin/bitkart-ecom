import * as categoryService from "../../services/category-service.js";
import * as productService from "../../services/product-service.js";
import { sideMenuPath, statusOptions, filterOptions, dashboardRoute, getSideMenus } from "../../helpers/admin-helpers.js";

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
