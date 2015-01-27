---
---

/*jshint jquery:true,browser:true,curly: false */
hello.init({
  github : '4b8d48289d4d2d36833d'
},{
  redirect_uri : 'http://openaddresses.io/login/index.html',
  oauth_proxy : 'https://auth-server.herokuapp.com/proxy'
});

$('.js-login-github').on('click', function() {
  var github = hello('github');
  github.login(function() {
    github.api( '/me', function(p) {
      if (p.login) window.location.href = '{{site.baseurl}}/contribute/';
    });
  });
  return false;
});
