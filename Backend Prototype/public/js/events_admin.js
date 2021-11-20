$("#delete-button").on('click', function(){
    var session_name =$(this).attr('');
    $.ajax({
        method: "POST",
        url: "/delete_sesion",
        data: {"session_name": session_name},

    })
})
