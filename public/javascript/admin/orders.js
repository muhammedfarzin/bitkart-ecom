function changeOrderStatus(status, elem) {
  App.request({
    url: location.pathname,
    type: "PATCH",
    data: { status },
    dataType: "json",
    success: function (data) {
      showAlertBox(data.message, true);
      location.reload();
    },
  });
}
