document.addEventListener("DOMContentLoaded", function () {
  $("#cancelOrderBtn").on("click", (e) => {
    showConfirmBox("Do you really want to cancel the order?", () => {
      $.ajax({
        url: location.href,
        type: "DELETE",
        success: function (data) {
          showAlertBox(data.message ?? "Order cancelled", true);
          location.reload();
        },
        error: function (err) {
          showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
        },
      });
    });
  });

  $("#completePendingPaymentBtn").on("click", (e) => {
    const url = new URL(location.href);
    url.pathname += "/completePayment";
    $.ajax({
      url: url.toString(),
      type: "POST",
      success: function (data) {
        razorpayPayment(data);
      },
      error: function (err) {
        showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
      },
    });
  });

  $("#returnOrderFrm").submit((e) => {
    e.preventDefault();
    let formData = $("#returnOrderFrm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      formObject[this.name] = this.value;
    });
    $.ajax({
      url: location.href + "/return",
      type: "PATCH",
      data: formObject,
      dataType: "json",
      success: function (data) {
        location.reload();
      },
      error: function (err) {
        showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
      },
    });
  });

  $("#reviewForm").submit((e) => {
    e.preventDefault();
    let formData = $("#reviewForm").serializeArray();
    let formObject = {};
    $.each(formData, function () {
      formObject[this.name] = this.value;
    });
    if (formObject.starRating < 1 || formObject.starRating > 5) {
      showAlertBox("Please select valid starRating");
    } else {
      $.ajax({
        url: location.href + "/addReview",
        type: "POST",
        data: formObject,
        dataType: "json",
        success: function (data) {
          showAlertBox(data.message || "Review submitted", true);
        },
        error: function (err) {
          showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
        },
      });
    }
  });
});

function changeStarRating(value) {
  const starRatingList = $(".starRating");
  starRatingList.each((index, element) => {
    if (index < value) {
      $(element).css("fill", "#6F43BF");
    } else {
      $(element).css("fill", "none");
    }
  });
  $("#starRating").val(value);
  $("#submitBtn").prop("disabled", false);
}
