document.addEventListener("DOMContentLoaded", () => {
  const TARGET_BYTES = 500 * 1024;
  const MAX_BYTES = 10 * 1024 * 1024;
  const popup = document.getElementById("popup-image");
  const cropGallery = document.getElementById("crop-image-gallery");
  const configurations = [
    ["image-input", "image-picker", "crop-done", 1, true],
    ["image-input-re", "image-picker-re", "category-crop-done", 1, false],
    [
      "banner-image-input",
      "banner-image-picker",
      "banner-crop-done",
      21 / 6,
      false,
    ],
  ];

  async function compress(cropper) {
    let canvas = cropper.getCroppedCanvas({ maxWidth: 1600, maxHeight: 1600 });
    if (!canvas) throw new Error("Image is not ready. Please try again.");
    for (let attempt = 0; attempt < 10; attempt++) {
      for (const quality of [0.82, 0.65, 0.45]) {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
        if (!blob) throw new Error("Unable to compress this image.");
        if (blob.size <= TARGET_BYTES) return blob;
      }
      const smaller = document.createElement("canvas");
      smaller.width = Math.max(1, Math.floor(canvas.width * 0.75));
      smaller.height = Math.max(1, Math.floor(canvas.height * 0.75));
      smaller
        .getContext("2d")
        .drawImage(canvas, 0, 0, smaller.width, smaller.height);
      canvas = smaller;
    }
    throw new Error("Unable to compress this image to 500 KB.");
  }

  for (const [
    inputId,
    pickerId,
    doneId,
    aspectRatio,
    multiple,
  ] of configurations) {
    const input = document.getElementById(inputId);
    if (!input) continue;
    const picker = document.getElementById(pickerId);
    const done = document.getElementById(doneId);
    let croppers = [];
    let sourceUrls = [];
    let previewUrls = [];
    let pending = false;
    let busy = false;
    input.accept = "image/jpeg,image/png,image/webp";
    picker.addEventListener("click", () => {
      if (!busy) input.click();
    });
    input.form?.addEventListener(
      "submit",
      (event) => {
        if (pending || busy) {
          event.preventDefault();
          event.stopImmediatePropagation();
          showAlertBox(
            "Finish cropping and compressing your images before saving.",
          );
        }
      },
      true,
    );

    function cleanup() {
      croppers.forEach((cropper) => cropper.destroy());
      sourceUrls.forEach((url) => URL.revokeObjectURL(url));
      croppers = [];
      sourceUrls = [];
      cropGallery.replaceChildren();
    }

    input.addEventListener("change", () => {
      cleanup();
      pending = false;
      const files = Array.from(input.files);
      if (!files.length) return;
      if (
        files.length > (multiple ? 5 : 1) ||
        files.some(
          (file) =>
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > MAX_BYTES,
        )
      ) {
        input.value = "";
        showAlertBox(
          "Select up to " +
            (multiple ? 5 : 1) +
            " JPEG, PNG or WebP images, each under 10 MB.",
        );
        return;
      }
      pending = true;
      for (const file of files) {
        const container = document.createElement("div");
        container.className =
          "outlined-card m-2 center-box-v-24 object-fit-contain bg-light rounded-0 p-0";
        const image = document.createElement("img");
        const url = URL.createObjectURL(file);
        sourceUrls.push(url);
        image.src = url;
        image.onerror = () => {
          cleanup();
          input.value = "";
          pending = false;
          popup.style.visibility = "hidden";
          popup.style.opacity = "0";
          showAlertBox(
            "This image cannot be decoded. Please select another file.",
          );
        };
        container.append(image);
        cropGallery.append(container);
        croppers.push(new Cropper(image, { aspectRatio, viewMode: 1 }));
      }
      popup.style.visibility = "visible";
      popup.style.opacity = "1";
    });

    done.addEventListener("click", async (event) => {
      event.preventDefault();
      if (busy || !croppers.length) return;
      busy = true;
      done.disabled = true;
      input.disabled = true;
      const label = done.textContent;
      done.textContent = "Compressing�";
      try {
        const transfer = new DataTransfer();
        const blobs = [];
        for (const cropper of croppers) blobs.push(await compress(cropper));
        blobs.forEach((blob, index) =>
          transfer.items.add(
            new File(
              [blob],
              "image-" +
                index +
                (blob.type === "image/webp" ? ".webp" : ".png"),
              { type: blob.type },
            ),
          ),
        );
        input.files = transfer.files;
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls = blobs.map((blob) => URL.createObjectURL(blob));
        if (inputId === "banner-image-input") {
          const preview = document.getElementById("banner-img");
          preview.src = previewUrls[0];
          preview.classList.remove("d-none");
          document.getElementById("add-image-ui")?.remove();
        } else {
          const gallery = multiple
            ? document.getElementById("image-gallery")
            : picker;
          gallery.replaceChildren();
          for (const url of previewUrls) {
            const preview = document.createElement("img");
            preview.src = url;
            preview.alt = "Compressed image preview";
            preview.className = multiple
              ? "outlined-card m-2 center-box-v-17 object-fit-contain bg-light"
              : "object-fit-contain bg-light w-100 h-100 rounded-4";
            gallery.append(preview);
          }
        }
        pending = false;
        cleanup();
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
      } catch (error) {
        showAlertBox(error.message);
      } finally {
        busy = false;
        done.disabled = false;
        input.disabled = false;
        done.textContent = label;
      }
    });
  }
});
