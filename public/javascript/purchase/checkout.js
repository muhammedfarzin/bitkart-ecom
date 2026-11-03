document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  const placeOrderForm = $("#placeOrderFrm");

  const promocodeInput = $("#promocode");
  const promocodeBtn = $("#promocodeBtn");

  $("#placeOrderBtn").on("click", () => placeOrderForm.submit());

  placeOrderForm?.submit((e) => {
    e.preventDefault();
    let formData = placeOrderForm.serializeArray();
    let formObject = {};
    $.each(formData, function () {
      formObject[this.name] = this.value;
    });
    if (!formObject.addressId) return showAlertBox("Please select an address");

    if (/^(cod|online|wallet)$/.test(formObject.paymentMethod)) {
      if (promocodeBtn.text() == "applied") {
        formObject.promocode = promocodeInput.val();
      }
      $.ajax({
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
        error: function (err) {
          showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
        },
      });
    } else {
      showAlertBox("Please select a valid payment method");
    }
  });

  promocodeInput.on("input", (e) => {
    const value = promocodeInput.val().replace(/\s/, "");
    if (value) {
      promocodeBtn.prop("disabled", false);
      promocodeInput.val(value);
    } else {
      promocodeBtn.prop("disabled", true);
      promocodeInput.val("");
    }
  });

  $("#promocodeForm").submit((e) => {
    e.preventDefault();
    const promocode = promocodeInput.val().replace(/\s/, "");
    errMessage.text("");
    if (promocode) {
      promocodeBtn.prop("disabled", true);
      $.ajax({
        url: "/checkout/verifyPromocode",
        type: "POST",
        data: { promocode },
        dataType: "json",
        success: function (data) {
          const totalAmountElem = $("#totalAmount");
          const totalAmount = parseFloat(
            totalAmountElem.text().replace("₹", "").replace(/,/g, ""),
          );
          $("#promocodeSummary").removeClass("d-none").addClass("d-flex");
          $("#promocodeValue").text("-₹" + data.promocodeDiscount);
          totalAmountElem.text(
            "₹" +
              (totalAmount - data.promocodeDiscount).toLocaleString("en-IN"),
          );

          promocodeInput.prop("readonly", true);
          promocodeInput.css("cursor", "not-allowed");
          promocodeBtn.text("applied");
          promocodeBtn.removeClass("btn-primary").addClass("btn-success");
        },
        error: function (err) {
          showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
        },
      });
    }
  });
});
