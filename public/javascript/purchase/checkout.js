// This script follows the checkout markup: bind immediately, before interaction.
(() => {
  const placeOrderForm = document.getElementById("place-order-frm");
  const promocodeForm = document.getElementById("promocode-frm");
  if (!placeOrderForm || !promocodeForm) return;
  const promocodeInput = document.getElementById("promocode");
  const applyPromocodeBtn = document.getElementById("promocode-btn");
  const removePromocodeBtn = document.getElementById("remove-promocode-btn");
  const placeOrderBtn = document.getElementById("place-order-btn");
  const promocodeFeedback = document.getElementById("promocode-feedback");

  let appliedCode = "";
  let totalBeforeCoupon = null;
  let applying = false;
  let ordering = false;

  const normalize = (value) => value.replace(/\s/g, "").toUpperCase();
  const message = (text, error = false) => {
    promocodeFeedback.textContent = text;
    promocodeFeedback.classList.toggle("visually-hidden", !error);
    promocodeFeedback.classList.toggle("text-danger", error);
    promocodeFeedback.classList.toggle("text-success", !error);
  };

  promocodeInput.addEventListener("input", () => {
    promocodeInput.value = normalize(promocodeInput.value);
    applyPromocodeBtn.disabled =
      applying || Boolean(appliedCode) || !promocodeInput.value;
    message("");
  });
  applyPromocodeBtn.disabled = !normalize(promocodeInput.value);

  removePromocodeBtn.addEventListener("click", () => {
    if (!appliedCode || applying || ordering) return;
    appliedCode = "";
    document.getElementById("total-amount").textContent =
      App.formatCurrency(totalBeforeCoupon);
    const promocodeSummary = document.getElementById("promocode-summary");
    promocodeSummary.classList.remove("d-flex");
    promocodeSummary.classList.add("d-none");
    document.getElementById("promocode-value").textContent = "";
    promocodeInput.value = "";
    promocodeInput.readOnly = false;
    applyPromocodeBtn.textContent = "Apply";
    applyPromocodeBtn.classList.replace("btn-success", "btn-primary");
    applyPromocodeBtn.disabled = true;
    removePromocodeBtn.hidden = true;
    message("Coupon removed.");
    promocodeInput.focus();
  });

  promocodeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (applying || appliedCode || ordering) return;
    const code = normalize(promocodeInput.value);
    promocodeInput.value = code;
    if (!code) {
      message("Enter a coupon code.", true);
      promocodeInput.focus();
      return;
    }

    applying = true;
    applyPromocodeBtn.disabled = true;
    placeOrderBtn.disabled = true;
    promocodeInput.readOnly = true;
    promocodeForm.setAttribute("aria-busy", "true");
    applyPromocodeBtn.textContent = "Applying...";
    message("");

    try {
      const response = await fetch(promocodeForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams({ promocode: code }),
      });
      if (
        response.redirected ||
        !response.headers.get("content-type")?.includes("application/json")
      )
        throw new Error(
          "Your session may have expired. Refresh the page and sign in again.",
        );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.errMessage || "Unable to apply this coupon.");
      if (
        ![data.totalPrice, data.deliveryCharge, data.promocodeDiscount].every(
          Number.isFinite,
        )
      )
        throw new Error("Unable to update the total. Please try again.");
      const promocodeSummary = document.getElementById("promocode-summary");
      promocodeSummary.classList.remove("d-none");
      promocodeSummary.classList.add("d-flex");
      document.getElementById("promocode-value").textContent =
        "-" + App.formatCurrency(data.promocodeDiscount);
      document.getElementById("total-amount").textContent = App.formatCurrency(
        data.totalPrice + data.deliveryCharge - data.promocodeDiscount,
      );
      appliedCode = code;
      totalBeforeCoupon = data.totalPrice + data.deliveryCharge;
      removePromocodeBtn.hidden = false;
      applyPromocodeBtn.classList.replace("btn-primary", "btn-success");
      message("Coupon applied successfully.");
    } catch (error) {
      message(
        error instanceof TypeError
          ? "Unable to connect. Please try again."
          : error.message,
        true,
      );
    } finally {
      applying = false;
      promocodeForm.removeAttribute("aria-busy");
      promocodeInput.readOnly = Boolean(appliedCode);
      applyPromocodeBtn.disabled =
        Boolean(appliedCode) || !promocodeInput.value;
      applyPromocodeBtn.textContent = appliedCode ? "Applied" : "Apply";
      placeOrderBtn.disabled = ordering;
    }
  });

  placeOrderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (applying || ordering || !App.validateSubmit(event)) return;
    const data = App.formData(placeOrderForm);
    if (!/^(cod|online|wallet)$/.test(data.paymentMethod)) {
      showAlertBox("Please select a valid payment method");
      return;
    }
    if (appliedCode) data.promocode = appliedCode;
    ordering = true;
    placeOrderBtn.disabled = true;
    applyPromocodeBtn.disabled = true;
    removePromocodeBtn.disabled = true;
    App.request({
      url: placeOrderForm.action,
      type: "POST",
      data,
      dataType: "json",
      success: (result) => {
        if (result.orderPlaced) location.href = result.redirect ?? "/";
        else razorpayPayment(result);
      },
      complete: () => {
        ordering = false;
        placeOrderBtn.disabled = false;
        removePromocodeBtn.disabled = false;
        applyPromocodeBtn.disabled =
          Boolean(appliedCode) || !promocodeInput.value;
      },
    });
  });
})();
