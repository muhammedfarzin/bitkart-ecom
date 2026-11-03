document.addEventListener("DOMContentLoaded", function () {
  const errMessage = $("#err-message");
  $("#couponForm").submit((e) => {
    e.preventDefault();
    errMessage.text("");
    formData = $("#couponForm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      const value = this.value.trim();
      if (!value && this.name != "category") {
        $("#" + this.name).addClass("err");
        const currentMessage = errMessage.text();
        errMessage.text(
          currentMessage +
            (currentMessage ? ", " : "Please enter ") +
            this.name.replace(/([a-z])([A-Z])/g, "$1 $2"),
        );
      } else $("#" + this.name).removeClass("err");
      formObject[this.name] = value;
    });

    if (formObject.discountValue < 1) {
      $("#discountValue").addClass("err");
      showAlertBox("Discount value cannot be less than 1");
    } else if (formObject.minPurchaseAmount < 1) {
      $("#minPurchaseAmount").addClass("err");
      showAlertBox("Minimum purchase amount cannot be less than 1");
    } else if (formObject.maxDiscountAmount < 1) {
      $("#maxDiscountAmount").addClass("err");
      showAlertBox("Maximum purchase amount cannot be less than 1");
    } else if (!errMessage.text()) {
      $("#couponForm")[0].submit();
    }
  });
});

function deleteCoupon(couponId) {
  $.ajax({
    url: "/admin/coupons/remove/" + couponId,
    type: "DELETE",
    success: function (data) {
      $("#coupon" + couponId).remove();
    },
    error: function (err) {
      showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
    },
  });
}
