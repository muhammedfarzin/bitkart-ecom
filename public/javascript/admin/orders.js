function changeOrderStatus(status, elem) {
  App.request({
    url: location.href + "/updateStatus",
    type: "POST",
    data: { status },
    dataType: "json",
    success: function (data) {
      showAlertBox(data.message, true);
      location.reload();
    },
  });
}
