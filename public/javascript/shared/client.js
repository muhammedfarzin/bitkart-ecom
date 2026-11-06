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

// Native forms only support GET/POST; submit resource mutations with their real method.
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form?.matches("[data-rest-form]") || event.defaultPrevented) return;
  event.preventDefault();
  if (!FormValidation.validate(form)) return;
  const url = new URL(form?.action, location.href);
  const redirect = new URL(location.href).searchParams.get("redirect");
  if (redirect) url.searchParams.set("redirect", redirect);
  const data = new FormData(form);
  try {
    const response = await fetch(url, {
      method: form?.dataset.method,
      body:
        form?.enctype === "multipart/form-data"
          ? data
          : new URLSearchParams(data),
    });
    if (response.redirected) {
      location.assign(response.url);
      return;
    }
    if (response.headers.get("content-type")?.includes("text/html")) {
      const html = await response.text();
      const page = new DOMParser().parseFromString(html, "text/html");
      document.documentElement.replaceWith(page.documentElement);
    } else if (!response.ok) {
      App.showRequestError({ responseJSON: await response.json() });
    }
  } catch {
    showAlertBox("Unable to submit the form. Please try again.");
  }
});
