
document.addEventListener('DOMContentLoaded', function () {
    const errMessage = $('#err-message');
    const customDateForm = $('#customDateForm');
    $('#customDateBtn').on('click', () => customDateForm?.submit());
    customDateForm?.submit((e) => {
        e.preventDefault();
        $('#err-message').text('');
        let formData = customDateForm.serializeArray();
        const url = new URL(location.href);
        url.searchParams.set('duration', 'custom');
        $.each(formData, function () {
            if (this.value) {
                $('#' + this.name).removeClass('err');
                url.searchParams.set(this.name, this.value);
            } else {
                $('#' + this.name).addClass('err');
                errMessage.text('Please enter a valid date');
            }
        });

        if (!errMessage.text()) {
            location.href = url.toString();
        }
    });
});

function toggleUserStatus(userId) {
    $.ajax({
        url: '/admin/users/toggleStatus/',
        type: 'PATCH',
        data: { userId },
        dataType: 'json',
        success: function (data) {
            console.log(data)
            document.getElementById('status' + userId).innerText = data.newStatus;
            const blockBtn = document.getElementById('block' + userId);
            if (data.newStatus == 'active') {
                blockBtn.innerText = 'Block';
                blockBtn.classList.replace('btn-primary', 'btn-danger');
            } else {
                blockBtn.innerText = 'Unblock';
                blockBtn.classList.replace('btn-danger', 'btn-primary');
            }
        },
        error: function (err) {
            showAlertBox(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    })
}

function deleteCategory(categoryId) {
    $.ajax({
        url: '/admin/categories/delete',
        type: 'DELETE',
        data: { categoryId },
        dataType: 'json',
        success: function (data) {
            showAlertBox('Category deleted successfully', true);
            location.reload();
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}

const selectDuration = document.getElementById('selectDuration');
selectDuration.onclick = () => {
    const value = selectDuration.value;
    if (value == 'custom') {
        document.getElementById('showCustomDateModalBtn').click();
    } else {
        const url = new URL(location.href);
        url.searchParams.set('duration', value);
        if (location.href != url.toString()) location.href = url.toString();
    }
}