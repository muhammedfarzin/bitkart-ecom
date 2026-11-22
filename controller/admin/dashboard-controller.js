import * as orderService from "../../services/order-service.js";
import { sideMenuPath, getSideMenus } from "../../helpers/admin-helpers.js";

export const showDashboard = async (req, res) => {
  try {
    const salesReport = await orderService.getSalesReport(req.query);
    const topProducts = await orderService.getTopSellingProducts(3, req.query);
    const sideMenus = getSideMenus(sideMenuPath.dashboard);
    let downloadUrl = new URL(
      req.originalUrl,
      req.protocol + "://" + req.get("host"),
    );
    downloadUrl.pathname = "/admin/sales-report";
    res.render("admin/index", {
      salesReport,
      topProducts,
      sideMenus,
      downloadUrl,
      duration: req.query.duration,
    });
  } catch (err) {
    res.status(400).render("admin/error", { errMessage: err.message });
  }
};

export const downloadSalesReport = async (req, res) => {
  if (req.query.fileType == "excel") {
    const salesReportExcelBuffer = await orderService.getSalesReportExcel(
      req.query,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.xlsx"',
    );
    res.send(salesReportExcelBuffer);
  } else {
    const salesReportPdfBuffer = await orderService.getSalesReportPdf(
      req.query,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.pdf"',
    );
    res.send(salesReportPdfBuffer);
  }
};
