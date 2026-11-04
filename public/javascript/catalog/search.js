document.addEventListener("DOMContentLoaded", function () {
  $(".product-search-frm").submit((e) => {
    if (!App.validateSubmit(e)) return;
    const url = new URL(location.href);
    if (url.pathname == "/search") {
      e.preventDefault();
      const searchData = $(e.currentTarget).serializeArray()[0];
      url.searchParams.set(searchData.name, searchData.value);
      url.searchParams.delete("page");
      location.replace(url.toString());
    }
  });
});
