/*jshint jquery:true,browser:true,curly: false */
var base = 'https://api.github.com/';
var auth;
if (localStorage.hello) auth = '?access_token=' + JSON.parse(localStorage.hello).github.access_token;
else auth = '?access_token=' + localStorage.token;
var masterRef = 'openaddresses/openaddresses/git/refs/heads/master';
var userName = '';
var masterSha = '';
var userRef = '';
var sidebarList = {};

//Create Branch to allow saving/Pull request
jQuery.get(base + 'repos/' + masterRef + auth, function (data) {
    masterSha = data.object.sha;
    //Fork oa/oa into user account
    jQuery.post(base + 'repos/openaddresses/openaddresses/forks' + auth, function(data) {
        userName = data.full_name;
        userRef = Date.now();
    });
});

//Create Sidebar by getting list of sources from GH
jQuery.get(base + 'repos/openaddresses/openaddresses/contents/sources' + auth, function(data) {
    sidebarList = { "sources": data.filter(function(source) { return source.name.indexOf('.json') !== -1 }) };
    sidebarList.sources = sidebarList.sources.map(function(source) {
        source.country = source.name.split('-')[0];
        return source;
    });
    renderSidebar(sidebarList);
});

function filter(query) {
    query = query.replace(/[-_\ ]/g, '');
    var lists = sidebarList.sources.filter(function(list) {
        return list.name.replace(/[-_\ ]*/g, '').indexOf(query) !== -1;
    });
    renderSidebar({"sources": lists});
}

function renderSidebar(list) {
    $.get('../blocks/contribute-sidebar.mst', function(template) {
        $('.sidebar').removeClass('loading');
        $('.sidebar-content').html(Mustache.render(template, list));

        $('.buttonContainer').off().on('click', function () {
            if ( $(this).hasClass('newSource') ) renderSource({filename: "New Source"});
            else $(this).each(function(index) { if (index === 0) loadSource($(this).text().trim()); });
        });
    });
}

//If a source is clicked on, load it from GH
function loadSource(name) {
    jQuery.get(base + 'repos/openaddresses/openaddresses/contents/sources/' + name + auth, function(sourceRaw) {
        var source = JSON.parse(atob(sourceRaw.content));
        source.filename = name;
        renderSource(source);
    });
}

function renderSource(source) {
    $.get('../blocks/contribute-main-edit.mst', function(template) {
        $('.content').html(Mustache.render(template, source));
        if (source.type) $('.type > .' + source.type) .prop('selected', true);
        
        if (source.compression) $('.compression > .' + source.compression).prop('selected', true);
        else if (source.data && !source.compression) $('.compression > .none').prop('selected', true);
        
        $('.paneTitle').hover(function() {
            $(this).find('> .helpIcon').css('display', 'block');
        }, function() {
            $(this).find('> .helpIcon').css('display', 'none');
        }); 
        $('.actionClose').click(closeEdit);
        $('.actionSave').click(saveEdit);
    });
}

function closeEdit() {
    swal({
        title: "Are you sure?",
        text: "Any changes you have made will be lost",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Continue",
        closeOnConfirm: false 
    }, function() {
        $('.content').ready(function() { $(".content").load("blocks/contribute-main-help.html"); });
    });
}

function saveEdit() {
    //Create branch that references oa/oa/ref/master
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: '{ "ref": "refs/heads/' + userRef + '", "sha": "' + masterSha + '" }',
        dataType: 'json',
        success: function (data) {
            swal("Good job!", "You're changes are awaiting review", "success")
        },
        error: function() {
            console.log('FAIL');
        },
        processData: false,
        type: 'POST',
        url: base + 'repos/' + userName + '/git/refs' + auth
    }); 
}

//==== Search Bar ====
//On focus change color
$( document ).ready(function() {
    $('input#search').focus(function(){
        $('.searchContainer').css("background-color","#F1F1F1");
    });

    //On focusoff lose color
    $('input#search').focusout(function(){
        $('.searchContainer').css("background-color","#ffffff");
    }); 
    
    $('input#search').keyup(function() {
        filter($(this).val()); 
    });
});