document.addEventListener("DOMContentLoaded", function () {
  $("#filterForm").submit((e) => {
    e.preventDefault();
    const url = new URL(location.href);
    let formData = $("#filterForm").serializeArray();
    const categoryDatasArray = [];
    $.each(formData, function () {
      if (this.name == "categories") categoryDatasArray.push(this.value);
      else if (this.value) url.searchParams.set(this.name, this.value);
      else url.searchParams.delete(this.name);
    });
    if (categoryDatasArray.length)
      url.searchParams.set(
        "categories",
        encodeURIComponent(JSON.stringify(categoryDatasArray)),
      );
    else url.searchParams.delete("categories");
    url.searchParams.delete("page");
    location.replace(url);
  });
});
const selectSort = document.getElementById("selectSort");
if (selectSort) {
  selectSort.onclick = () => {
    const value = selectSort.value;
    const url = new URL(location.href);
    url.searchParams.set("sort", value);
    url.searchParams.delete("page");
    if (location.href != url.toString()) location.href = url.toString();
  };
}
