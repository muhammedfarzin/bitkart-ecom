document.addEventListener("DOMContentLoaded", function () {
  $("#cancel-order-btn").on("click", (e) => {
    showConfirmBox("Do you really want to cancel the order?", () => {
      App.request({
        url: location.href,
        type: "DELETE",
        success: function (data) {
          showAlertBox(data.message ?? "Order cancelled", true);
          location.reload();
        },
      });
    });
  });

  $("#complete-pending-payment-btn").on("click", (e) => {
    const url = new URL(location.href);
    url.pathname += "/payments";
    App.request({
      url: url.toString(),
      type: "POST",
      success: function (data) {
        razorpayPayment(data);
      },
    });
  });

  $("#return-order-frm").submit((e) => {
    if (!App.validateSubmit(e)) return;
    e.preventDefault();
    const formObject = App.formData(e.currentTarget);
    App.request({
      url: location.pathname + "/returns",
      type: "POST",
      data: formObject,
      dataType: "json",
      success: function (data) {
        location.reload();
      },
    });
  });

  $("#review-frm").submit((e) => {
    if (!App.validateSubmit(e)) return;
    e.preventDefault();
    const formObject = App.formData(e.currentTarget);
    App.request({
      url: location.pathname + "/reviews",
      type: "POST",
      data: formObject,
      dataType: "json",
      success: data => showAlertBox(data.message || "Review submitted", true),
    });
  });
});

function changeStarRating(value) {
  const starRatingList = $(".star-rating");
  starRatingList.each((index, element) => {
    $(element).css("fill", index < value ? "#6F43BF" : "none");
  });
  $("#star-rating").val(value);
  $("#submit-btn").prop("disabled", false);
}
