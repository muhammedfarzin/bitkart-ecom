function isImage(file) {
  return file && file["type"].split("/")[0] === "image";
}

document.addEventListener("DOMContentLoaded", function () {
  const imagesInput = document.getElementById("image-input");
  const imageGallery = document.getElementById("image-gallery");
  const popupWindow = document.getElementById("popup-image");
  const cropImageGallery = document.getElementById("crop-image-gallery");
  let imageCropperList = [];

  if (imagesInput) {
    imagesInput.addEventListener("change", handleImagesSelection);
    document
      .getElementById("image-picker")
      .addEventListener("click", () => imagesInput.click());
  }

  function handleImagesSelection(event) {
    imageGallery.innerHTML = null;
    const selectedImages = event.target.files;
    if (selectedImages.length > 5) {
      return showAlertBox("Maximum 5 images are allowed to upload.");
    }

    for (const image of selectedImages) {
      if (!isImage(image)) return showAlertBox("Please select an image");
      const imageUrl = URL.createObjectURL(image);
      let containerDiv = document.createElement("div");
      containerDiv.classList.add(
        "outlined-card",
        "m-2",
        "center-box-v-24",
        "object-fit-contain",
        "bg-light",
        "rounded-0",
        "p-0",
      );
      let newImage = document.createElement("img");
      newImage.src = imageUrl;
      containerDiv.append(newImage);
      cropImageGallery.append(containerDiv);
      const cropper = new Cropper(newImage, { aspectRatio: 1, viewMode: 1 });
      imageCropperList.push(cropper);
    }
    popupWindow.style.visibility = "visible";
    popupWindow.style.opacity = 1;
  }

  $("#cropDone").on("click", (e) => {
    popupWindow.style.opacity = 0;
    popupWindow.style.visibility = "hidden";
    for (const cropper of imageCropperList) {
      const imageUrl = cropper.getCroppedCanvas().toDataURL("image/jpg");
      const croppedImage = document.createElement("img");
      croppedImage.src = imageUrl;
      croppedImage.classList.add(
        "outlined-card",
        "m-2",
        "center-box-v-17",
        "object-fit-contain",
        "bg-light",
      );
      imageGallery.append(croppedImage);
    }
    imageCropperList = [];
    cropImageGallery.innerHTML = null;
  });

  const imageInput = document.getElementById("image-input-re");
  const imagePicker = document.getElementById("image-picker-re");
  let cropper;
  imageInput?.addEventListener("change", imageChanged);
  imagePicker?.addEventListener("click", () => imageInput.click());

  function imageChanged(element) {
    const image = element?.target?.files[0];
    if (!isImage(image)) return showAlertBox("Please select an image");
    const imageUrl = URL.createObjectURL(image);
    let containerDiv = document.createElement("div");
    containerDiv.classList.add(
      "outlined-card",
      "m-2",
      "center-box-v-24",
      "object-fit-contain",
      "bg-light",
      "rounded-0",
      "p-0",
    );
    const newImage = document.createElement("img");
    newImage.src = imageUrl;
    containerDiv.append(newImage);
    cropImageGallery.innerHTML = null;
    cropImageGallery.append(containerDiv);
    cropper = new Cropper(newImage, { aspectRatio: 1, viewMode: 1 });
    popupWindow.style.visibility = "visible";
    popupWindow.style.opacity = 1;
    // newImage.classList.add('object-fit-contain', 'bg-light', 'w-100', 'h-100', 'rounded-4');
  }

  $("#cCropDone").on("click", (e) => {
    popupWindow.style.opacity = 0;
    popupWindow.style.visibility = "hidden";
    const imageUrl = cropper.getCroppedCanvas().toDataURL("image/jpg");
    const croppedImage = document.createElement("img");
    croppedImage.src = imageUrl;
    croppedImage.classList.add(
      "object-fit-contain",
      "bg-light",
      "w-100",
      "h-100",
      "rounded-4",
    );
    imagePicker.classList.add("bg-light");
    imagePicker.innerHTML = null;
    imagePicker.appendChild(croppedImage);
    cropper = null;
  });

  // banner image
  const bannerImageInput = document.getElementById("banner-image-input");
  const bannerImagePicker = document.getElementById("banner-image-picker");
  let bannerCropper;
  bannerImageInput?.addEventListener("change", bannerImageChanged);
  bannerImagePicker?.addEventListener("click", () => bannerImageInput.click());

  function bannerImageChanged(element) {
    const image = element?.target?.files[0];
    if (!isImage(image)) return showAlertBox("Please select an image");
    const imageUrl = URL.createObjectURL(image);
    let containerDiv = document.createElement("div");
    containerDiv.classList.add(
      "outlined-card",
      "m-2",
      "center-box-v-24",
      "object-fit-contain",
      "bg-light",
      "rounded-0",
      "p-0",
    );
    const newImage = document.createElement("img");
    newImage.src = imageUrl;
    containerDiv.append(newImage);
    cropImageGallery.innerHTML = null;
    cropImageGallery.append(containerDiv);
    bannerCropper = new Cropper(newImage, { aspectRatio: 21 / 6, viewMode: 1 });
    popupWindow.style.visibility = "visible";
    popupWindow.style.opacity = 1;
  }

  $("#bannerCropDone").on("click", (e) => {
    popupWindow.style.opacity = 0;
    popupWindow.style.visibility = "hidden";
    const imageUrl = bannerCropper.getCroppedCanvas().toDataURL("image/jpg");
    bannerCropper.getCroppedCanvas().toBlob(function (blob) {
      const croppedFile = new File([blob], bannerImageInput.files[0].name, {
        type: bannerImageInput.files[0].type,
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      bannerImageInput.files = dataTransfer.files;
    });

    bannerCropper = null;
    $("#bannerImg").attr("src", imageUrl);
    $("#bannerImg").removeClass("d-none");
    $("#addImageUI").remove();
  });
});
