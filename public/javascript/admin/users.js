function toggleUserStatus(userId) {
  App.request({
    url: "/admin/users/" + encodeURIComponent(userId) + "/status",
    type: "PATCH",
    dataType: "json",
    success: function (data) {
      const status = new URL(location.href).searchParams.get('status');
      if (status && status !== 'all' && status !== data.newStatus) {
        location.reload();
        return;
      }
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
