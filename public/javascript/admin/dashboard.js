document.addEventListener("DOMContentLoaded", () => {
  const form = $("#custom-date-frm");
  $("#custom-date-btn").on("click", () => form.submit());
  form.submit(event => {
    if (!App.validateSubmit(event)) return;
    event.preventDefault();
    const url = new URL(location.href);
    url.searchParams.set("duration", "custom");
    for (const [name, value] of Object.entries(App.formData(event.currentTarget))) {
      url.searchParams.set(name, value);
    }
    location.href = url.toString();
  });
});

const selectDuration = document.getElementById("select-duration");
selectDuration.onchange = () => {
  const value = selectDuration.value;
  if (value == "custom") {
    document.getElementById("show-custom-date-modal-btn").click();
  } else {
    const url = new URL(location.href);
    url.searchParams.set("duration", value);
    if (location.href != url.toString()) location.href = url.toString();
  }
};
