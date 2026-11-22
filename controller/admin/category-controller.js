import * as categoryService from "../../services/category-service.js";
import * as productService from "../../services/product-service.js";
import { sideMenuPath, dashboardRoute, getSideMenus } from "../../helpers/admin-helpers.js";

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
