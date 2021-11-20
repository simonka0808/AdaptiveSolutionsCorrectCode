$("#delete-button").on('click', function(){
    var session_name =$("#session_name").attr('session_name');
    $.ajax({
        method: "POST",
        url: "/delete_sesion",
        data: {"session_name": session_name},
        success: function(result) {
            if(result == true) {
                location.reload();
            }
        }
    })
});
