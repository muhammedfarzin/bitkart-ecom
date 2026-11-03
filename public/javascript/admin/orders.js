function changeOrderStatus(status, elem) {
  $.ajax({
    url: location.href + "/updateStatus",
    type: "POST",
    data: { status },
    dataType: "json",
    success: function (data) {
      showAlertBox(data.message, true);
      location.reload();
    },
    error: function (err) {
      showAlertBox(err.responseJSON?.errMessage ?? "Something went wrong");
    },
  });
}
