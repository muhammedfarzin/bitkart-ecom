function removeAddress(addressId) {
  App.request({
    url: "/account/address/" + addressId,
    type: "DELETE",
    success: function (data) {
      document.getElementById("close-modal-btn")?.click();
      $("#address-" + addressId).remove();
    },
  });
}
