$(document).ready(function (){
    // отслеживаем событие клика по веб-документу
    $(document).mouseup(function (e){
        console.log(e.target.id)
        if (e.target.id!="congrad" && e.target.id!="support"){ // проверка условия если клик был не по нашему блоку
            $("#ok2").hide();
            if($("#ok1").css('display') != 'block')
                $("#congrad").hide();
    }
    });

});
