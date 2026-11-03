function deleteCategory(categoryId) {
  $.ajax({
    url: "/admin/categories/delete",
    type: "DELETE",
    data: { categoryId },
    dataType: "json",
    success: function (data) {
      showAlertBox("Category deleted successfully", true);
      location.reload();
    },
    error: function (err) {
      alert(err.responseJSON?.errMessage ?? "Something went wrong");
    },
  });
}
