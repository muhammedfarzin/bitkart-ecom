function toggleUserStatus(userId) {
  App.request({
    url: "/admin/users/toggleStatus/",
    type: "PATCH",
    data: { userId },
    dataType: "json",
    success: function (data) {
      document.getElementById("status-" + userId).innerText = data.newStatus;
      const blockBtn = document.getElementById("block-" + userId);
      if (data.newStatus == "active") {
        blockBtn.innerText = "Block";
        blockBtn.classList.replace("btn-primary", "btn-danger");
      } else {
        blockBtn.innerText = "Unblock";
        blockBtn.classList.replace("btn-danger", "btn-primary");
      }
    },
  });
}
