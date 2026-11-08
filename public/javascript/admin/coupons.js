function refreshCouponStatusButton(button) {
  const { status, expiresAt, couponCode } = button.dataset;
  const available =
    ["active", "deactivated"].includes(status) &&
    Number(expiresAt) > Date.now();
  button.hidden = !available;
  const action = status === "deactivated" ? "Activate" : "Deactivate";
  button.textContent = action;
  button.setAttribute("aria-label", `${action} coupon ${couponCode}`);
  return available;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".coupon-activation").forEach((button) => {
    refreshCouponStatusButton(button);
    button.addEventListener("click", () => {
      const status =
        button.dataset.status === "deactivated" ? "active" : "deactivated";
      setCouponStatus(button.dataset.couponId, status, button);
    });
  });
});

window.addEventListener("focus", () => {
  document
    .querySelectorAll(".coupon-activation")
    .forEach(refreshCouponStatusButton);
});

function deleteCoupon(couponId) {
  showConfirmBox("Remove this coupon? This cannot be undone.", () => {
    App.request({
      url: "/admin/coupons/" + encodeURIComponent(couponId),
      type: "DELETE",
      success: function (data) {
        $("#coupon-" + couponId).remove();
      },
    });
  });
}

function setCouponStatus(couponId, status, button) {
  if (!refreshCouponStatusButton(button)) return;
  const action = status === "active" ? "activate" : "deactivate";
  showConfirmBox(`Do you want to ${action} this coupon?`, () => {
    if (!refreshCouponStatusButton(button)) return;
    button.disabled = true;
    App.request({
      url: "/admin/coupons/" + encodeURIComponent(couponId) + "/status",
      type: "PATCH",
      data: { status },
      success: () => location.reload(),
      complete: () => {
        button.disabled = false;
      },
    });
  });
}
