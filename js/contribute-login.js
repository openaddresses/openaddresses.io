/*jshint jquery:true,browser:true */
hello.init({
    github : '4b8d48289d4d2d36833d'
},{
    redirect_uri : 'contribute.html',
    oauth_proxy : 'https://auth-server.herokuapp.com/proxy'
});
function login() {
    var github = hello('github');
    github.login( function() {
        github.api( '/me', function(p){
            if (p.login) $(function() { $(".content-container").load("blocks/contribute-main.html"); });
        });
    });
}
