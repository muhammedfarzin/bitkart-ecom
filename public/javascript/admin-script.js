function blockUser(userId) {
    $.ajax({
        url: '/admin/users/block/',
        type: 'PATCH',
        data: { userId },
        dataType: 'json',
        success: function (data) {
            document.getElementById('status' + userId).innerText = 'Blocked';
            const blockBtn = document.getElementById('block' + userId);
            blockBtn.innerText = 'Unblock';
            blockBtn.classList.replace('btn-danger', 'btn-primary');
            blockBtn.onclick = function () {
                unblockUser(userId);
            };
        },
        error: function (err) {
            alert(err.responseJSON?.errMessage ?? 'Something went wrong');
        }
    })
}

function unblockUser(userId) {
    $.ajax({
        url: '/admin/users/unblock/',
        type: 'PATCH',
        data: { userId },
        dataType: 'json',
        success: function (data) {
            document.getElementById('status' + userId).innerText = 'active';
            const blockBtn = document.getElementById('block' + userId);
            blockBtn.innerText = 'Block';
            blockBtn.classList.replace('btn-primary', 'btn-danger');
            blockBtn.onclick = function () {
                blockUser(userId);
            };
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