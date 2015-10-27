//关闭自动填表
function noautoform() {
    var autoform = document.getElementsByTagName("form");
    for(var i = 0; i < autoform.length; i++)
        autoform[i].setAttribute("autocomplete", "off");
};
noautoform();

//双色球开关
$(function () {
    $("#sh").click(function () {
      var slider = $(this).attr('data-target');
        $("#arb").slideToggle(function(){
          if($(this).is(':visible')) {
            $(slider).slider('init');
          }
        });
    });
});
