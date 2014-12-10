/*jshint jquery:true,browser:true */
var base = 'https://api.github.com/';
var auth = '?access_token=' + JSON.parse(localStorage.hello).github.access_token;
var masterRef = 'openaddresses/openaddresses/git/refs/heads/master';
var userName = '';
var masterSha = '';
var userRef = '';

//Get Master SHA From oa/oa
jQuery.get(base + 'repos/' + masterRef + auth, function (data) {
    masterSha = data.object.sha;
    //Fork oa/oa into user account
    jQuery.post(base + 'repos/openaddresses/openaddresses/forks' + auth, function(data) {
        userName = data.full_name;
        userRef = Date.now();
        //Create branch that references oa/oa/ref/master
        //            $.ajax({
        //                contentType: 'application/json',
        //                crossDomain: true,
        //                data: '{ "ref": "refs/heads/' + userRef + '", "sha":  "327f5375dbc53f4f69a93e2d531cbe27dcc2f00d" }',
        //                dataType: 'json',
        //                success: function (data) {
        //                    console.log(JSON.stringify(data));
        //                },
        //                error: function() {
        //                    console.log('FAIL');
        //                },
        //                processData: false,
        //                type: 'POST',
        //                url: base + 'repos/' + userName + '/git/refs' + auth
        //            });
    });
});

jQuery.get(base + 'repos/openaddresses/openaddresses/contents/sources' + auth, function(data) {
    var sidebar = '<div class="buttonContainer"><div class="infoButton {{colour}}"></div><div class="mainButton"><div class="buttonImage {{country}}"></div><div class="buttonTextContainer"><div class="buttonText">{{name}}</div></div></div></div>';
    data.forEach(function(file) {
        if (file.name.indexOf('.json') !== -1) {
            $( ".sidebar" ).append(sidebar.replace('{{name}}', file.name.replace('.json', '')).replace('{{country}}', file.name.replace('.json', '').split('-')[0]) );
        }
    });
});

//==== Search Bar ====

//On focus change color
$('input#search').focus(function(){
    $('.searchContainer').css("background-color","#F1F1F1");
});

//On focusoff lose color
$('input#search').focusout(function(){
    $('.searchContainer').css("background-color","#ffffff");
});

//Hides Filter
$('input#search').keypress(function(){
    $('.filter').css("visibility","hidden");
});

//Shows Filter
$('input#search').on("keyup", function() {
    if ($('input#search').val() === '') {
        $('#filter').css("visibility","visible");
    } else {
        for (var i = 0; i<window.selection.checks.length; i++){
            if (window.selection.checks[i].children === true){
                for (var child = 0; child < window.selection.checks[i].subChecks.length; child++){
                    if (window.selection.checks[i].subChecks[child].name.contains($('input#search').val()) || window.selection.checks[i].subChecks[child].desc.contains($('input#search').val())){
                        $('#' + i + '.buttonContainer').css("display", "block");
                        window.selection.checks[i].enabled = true;
                    }
                }

                if ($(i + '.buttonContainer').css("display") != "block"){
                    $('#' + i + 'buttonContainer').css("display", "none");
                    window.selection.checks[i].enabled = false;
                }

            } else if (window.selection.checks[i].name.contains($('input#search').val()) || window.selection.checks[i].desc.contains($('input#search').val())){
                $('#' + i + '.buttonContainer').css("display", "block");
                window.selection.checks[i].enabled = true;
            } else {
                $('#' + i + '.buttonContainer').css("display", "none");
                window.selection.checks[i].enabled = false;
            }
        }
    }
});
