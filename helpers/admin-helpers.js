export const sideMenuPath = {
  dashboard: "/",
  users: "/users",
  orders: "/orders",
  products: "/products",
  categories: "/categories",
  coupons: "/coupons",
  banner: "/banner",
};

export const statusOptions = {
  users: ["active", "blocked"],
  products: ["active", "sold out"],
  orders: ["confirmed", "shipped", "delivered", "cancelled", "return"],
  coupons: ["active", "scheduled", "expired", "deactivated"],
};
export const filterOptions = (type) =>
  statusOptions[type].map((value) => ({
    value,
    label:
      value === "return"
        ? "Returned"
        : value.charAt(0).toUpperCase() + value.slice(1),
  }));
export const dashboardRoute = "/admin";
export const loginRoute = "/admin/login";

export function getSideMenus(pathName) {
  return Object.keys(sideMenuPath).map((title) => {
    return {
      title,
      path: dashboardRoute + sideMenuPath[title],
      active: sideMenuPath[title] == pathName,
    };
  });
}
