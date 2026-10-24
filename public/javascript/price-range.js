(() => {
  const filter = document.getElementById("priceRangeFilter");
  if (!filter) return;

  const minimum = document.getElementById("minAmount");
  const maximum = document.getElementById("maxAmount");
  const lower = document.getElementById("minPriceRange");
  const upper = document.getElementById("maxPriceRange");
  const limit = Number(filter.dataset.maximum);
  const minimumGap = 500;
  const amount = (input, fallback) =>
    input.value.trim() !== "" && Number.isFinite(input.valueAsNumber)
      ? Math.max(0, input.valueAsNumber)
      : fallback;

  function synchronize() {
    if (minimum.valueAsNumber === 0) minimum.value = "";
    lower.value = Math.min(limit, amount(minimum, 0));
    upper.value = Math.min(limit, amount(maximum, limit));
    filter.style.setProperty(
      "--range-start",
      `${(Number(lower.value) / limit) * 100}%`,
    );
    filter.style.setProperty(
      "--range-end",
      `${(Number(upper.value) / limit) * 100}%`,
    );
    // Keep the start handle reachable when both handles are at the right edge.
    lower.style.zIndex = Number(upper.value) === limit ? "3" : "1";
    maximum.setCustomValidity(
      amount(minimum, 0) + minimumGap > amount(maximum, Infinity)
        ? "Maximum price must be at least Rs 500 above minimum price."
        : "",
    );
    lower.setAttribute("aria-valuetext", `Rs ${lower.value}`);
    upper.setAttribute(
      "aria-valuetext",
      maximum.value === "" ? "No maximum" : `Rs ${upper.value}`,
    );
  }

  lower.addEventListener("input", () => {
    minimum.value = Math.min(
      Number(lower.value),
      Number(upper.value) - minimumGap,
    );
    synchronize();
  });
  upper.addEventListener("input", () => {
    maximum.value =
      Number(upper.value) === limit
        ? ""
        : Math.max(Number(upper.value), Number(lower.value) + minimumGap);
    synchronize();
  });
  minimum.addEventListener("input", synchronize);
  maximum.addEventListener("input", synchronize);
  minimum.addEventListener("change", () => {
    if (minimum.value !== "") {
      minimum.value = Math.min(
        amount(minimum, 0),
        amount(maximum, Infinity) - minimumGap,
      );
      if (maximum.value !== "" && amount(maximum, Infinity) < minimumGap) {
        maximum.value = minimumGap;
      }
    }
    synchronize();
  });
  maximum.addEventListener("change", () => {
    if (maximum.value !== "") {
      maximum.value = Math.max(
        amount(maximum, 0),
        amount(minimum, 0) + minimumGap,
      );
    }
    synchronize();
  });
  synchronize();
})();
