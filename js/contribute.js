/*jshint jquery:true,browser:true,curly: false */
$(function() {
    if (localStorage.hello && JSON.parse(localStorage.hello).github.expires > Date.now() / 1000) $(".content-container").load("blocks/contribute-main.html");
    else $(".content-container").load("blocks/contribute-login.html");
});
