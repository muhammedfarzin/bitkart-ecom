document.addEventListener('DOMContentLoaded', function () {
    console.log('selection started image');
    const imageInput = document.getElementById('image-input');
    const imageGallery = document.getElementById('image-gallery');

    imageInput.addEventListener('change', handleImageSelection);
    imageInput.addEventListener('beforeinput', handleImageSelection);
    document.getElementById('image-picker').addEventListener('click', () => imageInput.click());

    function handleImageSelection(event) {
        imageGallery.innerHTML = null;
        const selectedImages = event.target.files;
        if (selectedImages.length > 5) {
            alert('Maximum 5 images are allowed to upload.');
            return
        }

        for (const image of selectedImages) {
            const imageUrl = URL.createObjectURL(image);
            const newImage = document.createElement('img');
            const imgDiv = document.createElement('div');
            imgDiv.classList.add();
            newImage.src = imageUrl;
            newImage.alt = 'Selected Image';
            newImage.classList.add('outlined-card', 'm-2', 'center-box-v-17', 'object-fit-contain', 'bg-light');
            imgDiv.appendChild(newImage)
            imageGallery.appendChild(imgDiv);
        }

    }
});