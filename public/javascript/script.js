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

$('#productSearchBox').submit((e) => {
    const url = new URL(location.href);
    if (url.pathname == '/search') {
        e.preventDefault();
        const searchData = $('#productSearchBox').serializeArray()[0];
        url.searchParams.set(searchData.name, searchData.value);
        location.replace(url.toString());
    }
});