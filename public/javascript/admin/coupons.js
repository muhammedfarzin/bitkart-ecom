function deleteCoupon(couponId) {
  App.request({
    url: "/admin/coupons/" + couponId,
    type: "DELETE",
    success: function (data) {
      $("#coupon-" + couponId).remove();
    },
  });
}
