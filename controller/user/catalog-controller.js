import * as productService from "../../services/product-service.js";
import * as categoryService from "../../services/category-service.js";
import * as bannerService from "../../services/banner-service.js";

export const showHome = async (req, res) => {
  const banners = await bannerService.getBanners({ status: "active" });
  const products = await productService.getProducts({ status: "active" });
  const categories = await categoryService.getCategories();
  res.render("user/index", { products, categories, banners });
};

export const productOverview = async (req, res) => {
  try {
    const product = await productService.getProductOverview(req.params.id);
    const relatedProducts = await productService.getRelatedProducts(
      product
    );
    if (req.session.user?.wishlist?.includes(product._id))
      product.isWishlisted = true;
    res.render("user/products/products", { product, relatedProducts });
  } catch (err) {
    res.render("error", { errMessage: err.message });
  }
};

export const searchProducts = async (req, res) => {
  if (req.query.categories) {
    const categoryData = decodeURIComponent(req.query.categories);
    try {
      req.query.categories = JSON.parse(categoryData);
    } catch (err) {
      req.query.categories = [categoryData];
    }
  }
  const {
    products: searchResults,
    totalPages,
    currentPage,
  } = await productService.searchUserProducts(req.query);
  const categories = await categoryService.getAllCategoryTitles();
  const currentUrl = new URL(
    req.originalUrl,
    req.protocol + "://" + req.get("host")
  );
  const context = {
    searchResults,
    categories,
    totalPages,
    currentPage,
    selectedCategories: req.query.categories || [],
    userWishlist: req.session.user?.wishlist || [],
    searchQuery: req.query.search,
    minAmount: req.query.minAmount,
    maxAmount: req.query.maxAmount,
    sort: req.query.sort,
    currentUrl,
  };
  res.render("user/search/search-view", context);
};
