//关闭自动填表
function noautoform() {
    var autoform = document.getElementsByTagName("form");
    autoform.SetAttribute("autocomplete", "off");
};

noautoform();
