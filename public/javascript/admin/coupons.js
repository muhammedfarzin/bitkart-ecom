function deleteCoupon(couponId) {
  App.request({
    url: "/admin/coupons/remove/" + couponId,
    type: "DELETE",
    success: function (data) {
      $("#coupon-" + couponId).remove();
    },
  });
}
