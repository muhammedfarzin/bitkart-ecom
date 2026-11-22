import * as bannerService from "../../services/banner-service.js";
import { sideMenuPath, dashboardRoute, getSideMenus } from "../../helpers/admin-helpers.js";

export const showBannerList = async (req, res) => {
  const banners = await bannerService.getBanners();
  const sideMenus = getSideMenus(sideMenuPath.banner);
  res.render("admin/banner/banner-list", { banners, sideMenus });
};

export const createBanner = async (req, res) => {
  await bannerService.createBanner(req);
  res.redirect(303, dashboardRoute + sideMenuPath.banner);
};

export const updateBanner = async (req, res) => {
  await bannerService.updateBanner(req);
  res.redirect(303, dashboardRoute + sideMenuPath.banner);
};
