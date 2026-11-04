function deleteCategory(categoryId) {
  App.request({
    url: "/admin/categories/delete",
    type: "DELETE",
    data: { categoryId },
    dataType: "json",
    success: function (data) {
      showAlertBox("Category deleted successfully", true);
      location.reload();
    },
  });
}
