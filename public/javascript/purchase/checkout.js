document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  const placeOrderForm = $("#place-order-frm");

  const promocodeInput = $("#promocode");
  const promocodeBtn = $("#promocode-btn");

  $("#place-order-btn").on("click", () => placeOrderForm.submit());

  placeOrderForm?.submit((e) => {
    if (!App.validateSubmit(e)) return;
    e.preventDefault();
    const formObject = App.formData(e.currentTarget);

    if (/^(cod|online|wallet)$/.test(formObject.paymentMethod)) {
      if (promocodeBtn.text() == "applied") {
        formObject.promocode = promocodeInput.val();
      }
      App.request({
        url: "/placeOrder",
        type: "POST",
        data: formObject,
        dataType: "json",
        success: function (data) {
          if (data.orderPlaced) {
            location.href = data.redirect ?? "/";
          } else {
            razorpayPayment(data);
          }
        },
      });
    } else {
      showAlertBox("Please select a valid payment method");
    }
  });

  promocodeInput.on("input", (e) => {
    const value = promocodeInput.val().replace(/\s/, "");
    promocodeBtn.prop("disabled", !value);
    promocodeInput.val(value);
  });

  $("#promocode-frm").submit((e) => {
    if (!App.validateSubmit(e)) return;
    e.preventDefault();
    const promocode = promocodeInput.val().replace(/\s/, "");
    errMessage.text("");
    if (promocode) {
      promocodeBtn.prop("disabled", true);
      App.request({
        url: "/checkout/verifyPromocode",
        type: "POST",
        data: { promocode },
        dataType: "json",
        success: function (data) {
          const totalAmountElem = $("#total-amount");
          const totalAmount = parseFloat(
            totalAmountElem.text().replace("₹", "").replace(/,/g, ""),
          );
          $("#promocode-summary").removeClass("d-none").addClass("d-flex");
          $("#promocode-value").text(
            "-" + App.formatCurrency(data.promocodeDiscount),
          );
          totalAmountElem.text(
            App.formatCurrency(totalAmount - data.promocodeDiscount),
          );

          promocodeInput.prop("readonly", true);
          promocodeInput.css("cursor", "not-allowed");
          promocodeBtn.text("applied");
          promocodeBtn.removeClass("btn-primary").addClass("btn-success");
        },
        error: (error) => {
          promocodeBtn.prop("disabled", false);
          App.showRequestError(error);
        },
      });
    }
  });
});
