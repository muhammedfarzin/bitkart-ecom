document.addEventListener('DOMContentLoaded', function () {
    const imagesInput = document.getElementById('image-input');
    const imageGallery = document.getElementById('image-gallery');

    if (imagesInput) {
        imagesInput.addEventListener('change', handleImagesSelection);
        document.getElementById('image-picker').addEventListener('click', () => imagesInput.click());
    }

    function handleImagesSelection(event) {
        imageGallery.innerHTML = null;
        const selectedImages = event.target.files;
        if (selectedImages.length > 5) {
            alert('Maximum 5 images are allowed to upload.');
            return
        }

        for (const image of selectedImages) {
            const imageUrl = URL.createObjectURL(image);
            const newImage = document.createElement('img');
            newImage.src = imageUrl;
            newImage.alt = 'Selected Image';
            newImage.classList.add('outlined-card', 'm-2', 'center-box-v-17', 'object-fit-contain', 'bg-light');
            imageGallery.appendChild(newImage);
        }

    }

});

const imageInput = document.getElementById('image-input-re');
const imagePicker = document.getElementById('image-picker-re')
imagePicker.addEventListener('click', () => imageInput.click());

function imageChanged(element) {
    const image = element.files[0];
    const imageUrl = URL.createObjectURL(image);
    const newImage = document.createElement('img');
    newImage.src = imageUrl;
    newImage.alt = 'Selected Image';
    newImage.classList.add('object-fit-contain', 'bg-light', 'w-100', 'h-100', 'rounded-4');
    imagePicker.classList.add('bg-light');
    imagePicker.innerHTML = null;
    imagePicker.appendChild(newImage);
}