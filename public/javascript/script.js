const toastAlertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');

function showAlertBox(message, isPrimary) {
    alertMessage.innerText = message;
    const parentDiv = alertMessage.parentElement;
    if (isPrimary) parentDiv.classList.replace('bg-danger', 'bg-primary');
    else parentDiv.classList.replace('bg-primary', 'bg-danger');

    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastAlertBox);
    toastBootstrap.show();
}