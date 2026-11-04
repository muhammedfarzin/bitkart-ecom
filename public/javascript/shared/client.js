// Shared browser helpers. Dependencies are resolved when each helper is called.
window.App = (() => {
  const errorMessage = (error) =>
    error.responseJSON?.errMessage ?? "Something went wrong";
  const showRequestError = (error) => showAlertBox(errorMessage(error));

  function createRedirectXhr(url) {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("load", () => {
      if (!xhr.responseURL) return;
      const response = new URL(xhr.responseURL, location.href);
      const requested = new URL(url, location.href);
      if (
        response.origin === requested.origin &&
        response.pathname !== requested.pathname
      ) {
        location.href = response.href;
      }
    });
    return xhr;
  }

  function request({ followRedirects = false, ...options }) {
    if (followRedirects) options.xhr = () => createRedirectXhr(options.url);
    return $.ajax({ error: showRequestError, ...options });
  }

  // Keep jQuery's successful-control serialization and existing last-value semantics.
  function formData(form) {
    return Object.fromEntries(
      $(form)
        .serializeArray()
        .map(({ name, value }) => [name, value]),
    );
  }

  function validateSubmit(event) {
    if (FormValidation.validate(event.currentTarget)) return true;
    event.preventDefault();
    return false;
  }

  const formatCurrency = (amount) =>
    "\u20b9" + Number(amount).toLocaleString("en-IN");
  return {
    request,
    errorMessage,
    showRequestError,
    formData,
    validateSubmit,
    formatCurrency,
  };
})();
