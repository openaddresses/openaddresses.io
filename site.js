window.onload = function() {
    var parent = function(e, className) {
        if (!e.parentNode) {
            return false;
        } else if (!!~e.parentNode.className.split(' ').indexOf(className)) {
            return e.parentNode;
        } else {
            return parent(e.parentNode, className);
        }
    };
    var anchors = document.getElementsByClassName('anchor');
    for (var i = 0; i < anchors.length; i++) {
        anchors[i].onclick = function(e) {
            var slide = parent(e.toElement, 'slide');
            if (slide) {
                window.scrollTo(0, slide.offsetTop);
                window.location.hash = slide.className.split(' ').pop();
            }
            return false;
        };
    }
    (function() {
        if (window.location.hash) {
            var slide = document.getElementsByClassName(window.location.hash.substring(1));
            if (slide.length) {
                window.scrollTo(0, slide[0].offsetTop);
            }
        }
    })();
};
