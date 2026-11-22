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

// Date inputs and previews use the device timezone, shared with server parsing.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("coupon-frm");
  if (!form) return;
  const field = (name) => form.elements.namedItem(name);
  const day = AppDate.day;

  function update() {
    const scheduled = field("schedule").checked;
    if (!scheduled) field("startTime").value = "";
    document.getElementById("coupon-schedule-fields").hidden = !scheduled;
    ["startOption", "validFrom", "startTime"].forEach((name) => {
      field(name).disabled = !scheduled;
    });

    field("validFrom").required = !!scheduled;
    const mode = field("startOption").value;
    if (mode !== "pick")
      field("validFrom").value = day(mode === "tomorrow" ? 1 : 0);

    field("validFrom").readOnly = mode !== "pick";
    const percentage = field("discountType").value === "percentage";
    form.querySelector('label[for="discountValue"]').textContent = percentage
      ? "Discount (%)"
      : "Discount (\u20b9)";
    field("discountValue").max = percentage ? "100" : "1000000000";
    document.getElementById("maximum-discount-field").hidden = !percentage;
    field("maxDiscountAmount").disabled = !percentage;
    field("maxDiscountAmount").required = !!percentage;

    const start = `${field("validFrom").value}T${field("startTime").value || "00:00"}:00`;
    const end = new Date(`${field("validUpto").value}T23:59:59.999`);
    const state =
      form.dataset.status === "deactivated"
        ? "Inactive"
        : end <= new Date()
          ? "Expired"
          : scheduled && new Date(start) > new Date()
            ? "Scheduled"
            : "Active";
    const startSummary = scheduled
      ? `Starts ${field("validFrom").value} at ${field("startTime").value || "00:00"} ${AppDate.zone}`
      : "Starts immediately";
    const cap = percentage
      ? field("maxDiscountAmount").value
      : field("discountValue").value;
    const category = field("category").selectedOptions[0].textContent.trim();

    document.getElementById("coupon-preview-text").textContent =
      `${field("discountValue").value || "\u2014"}${percentage ? "%" : " rupees"} off ${category.toLowerCase()}, up to \u20b9${cap || "\u2014"}. Minimum eligible spend \u20b9${field("minPurchaseAmount").value || "\u2014"}. ${startSummary}; valid through ${field("validUpto").value || "\u2014"}. ${state}.`;
  }

  field("code").addEventListener("input", (event) => {
    const input = event.currentTarget;
    const normalize = (value) => value.replace(/\s/g, "").toUpperCase();
    const start = normalize(input.value.slice(0, input.selectionStart)).length;
    const end = normalize(input.value.slice(0, input.selectionEnd)).length;
    input.value = normalize(input.value);
    input.setSelectionRange(start, end);
  });

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  // Refresh Today/Tomorrow if the form remains open across midnight.
  form.addEventListener("submit", update, true);
  window.addEventListener("focus", update);
  update();
});
