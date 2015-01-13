---
---

var login = $('.js-login');
if (localStorage.hello || localStorage.token) {
  var base = 'https://api.github.com/';
  var auth = (localStorage.hello) ?
    '?access_token=' + JSON.parse(localStorage.hello).github.access_token :
    '?access_token=' + localStorage.token;

  $.get(base + 'user' + auth, function(data) {
    login
      .addClass('dot inline pad0 fill-darken1')
      .attr('href', '{{site.baseurl}}/contribute/')
      .append('<span>');

    login.find('span')
      .addClass('dot inline')
      .css({
        'background-image': 'url(\'' + data.avatar_url + '\')',
        'background-repeat': 'no-repeat',
        'background-size': 'contain',
        'height': '32px',
        'width': '32px',
        'vertical-align': 'middle'
      });
  });
} else {
  login.addClass('button').text('Sign in');
}
