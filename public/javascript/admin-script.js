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
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
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
            alert('Category deleted successfully');
            location.reload();
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    });
}