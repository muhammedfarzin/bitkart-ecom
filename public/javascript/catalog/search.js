document.addEventListener("DOMContentLoaded", function () {
  $("#productSearchBox").submit((e) => {
    const url = new URL(location.href);
    if (url.pathname == "/search") {
      e.preventDefault();
      const searchData = $("#productSearchBox").serializeArray()[0];
      url.searchParams.set(searchData.name, searchData.value);
      url.searchParams.delete("page");
      location.replace(url.toString());
    }
  });
});
