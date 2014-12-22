/*jshint jquery:true,browser:true,curly: false */
var GH = {
    base: 'https://api.github.com/',
    masterRef: 'openaddresses/openaddresses/git/refs/heads/master',
    currentSource: {},
    filename: ""
}
var newSource = false;
if (localStorage.hello) GH.auth = '?access_token=' + JSON.parse(localStorage.hello).github.access_token;
else GH.auth = '?access_token=' + localStorage.token;

var sidebarList = {};

//Ensure fork exists in user account
jQuery.get(GH.base + 'repos/' + GH.masterRef + GH.auth, function (data) {
    GH.masterSha = data.object.sha;
    //Fork oa/oa into user account
    jQuery.post(GH.base + 'repos/openaddresses/openaddresses/forks' + GH.auth, function(data) {
        GH.userName = data.full_name;
    });
});

//Create Sidebar by getting list of sources from GH
jQuery.get(GH.base + 'repos/openaddresses/openaddresses/contents/sources' + GH.auth, function(data) {
    sidebarList = { "sources": data.filter(function(source) { return source.name.indexOf('.json') !== -1 }) };
    sidebarList.sources = sidebarList.sources.map(function(source) {
        source.country = source.name.split('-')[0];
        return source;
    });
    renderSidebar(sidebarList);
    setStatus();
});

function setStatus() {
    //Set status by getting list of sources from data.openaddresses.io
    $.ajax({
        url: "http://data.openaddresses.io/state.json",
        type: "GET",
        crossDomain: true,
        success: function (res) {
            console.log(res);
        },
        error: function (xhr, status) {
            console.error(status);
        }
    });
}

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
            if ( $(this).hasClass('newSource') ) {
                newSource = true;
                GH.filename="NewSource.json";
                renderSource({filename: "NewSource.json"});
            } else $(this).each(function(index) { if (index === 0) loadSource($(this).text().trim()); });
        });
    });
}

//If a source is clicked on, load it from GH
function loadSource(name) {
    jQuery.get(GH.base + 'repos/openaddresses/openaddresses/contents/sources/' + name + GH.auth, function(sourceRaw) {
        GH.currentSource = JSON.parse(atob(sourceRaw.content));
        GH.sha = sourceRaw.sha;
        GH.filename = name;
        renderSource(GH.currentSource);
    });
}

function getValues() {
    GH.currentSource.data = $('.sourceData').val();
    GH.currentSource.website = $('.sourceWebsite').val();
    GH.currentSource.attribution = $('.sourceAttribution').val();
    if ($('.sourceCompression option:selected').val() !== "none") GH.currentSource.type = $('.sourceType option:selected').val();
    if ($('.sourceCompression option:selected').val() !== "none") GH.currentSource.type = $('.sourceCompression option:selected').val();
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
        $('.actionSave').click(createBranch);
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

function createBranch() {
    GH.userRef = Date.now();
    //Create branch that references oa/oa/ref/master
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: JSON.stringify({ 
            "ref": 'refs/heads/' + GH.userRef, 
            "sha": GH.masterSha 
        }),
        dataType: 'json',
        success: function (data) {
            saveSource();
        },
        error: function() {
            console.log('FAIL');
        },
        processData: false,
        type: 'POST',
        url: GH.base + 'repos/' + GH.userName + '/git/refs' + GH.auth
    }); 
}

function saveSource() {
    getValues();
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: JSON.stringify({
            "message": "Add " + GH.filename,
            "path": "sources/" + GH.filename,
            "content": btoa(JSON.stringify(GH.currentSource, null, 4)),
            "branch": '' + GH.userRef,
            "sha": GH.sha ? GH.sha : ""
        }),
        dataType: 'json',
        success: function (data) {
                prSource();
        },
        error: function() {
            console.log('FAIL');
        },
        type: 'PUT',
        url: GH.base + 'repos/' + GH.userName + '/contents/sources/' + GH.filename + GH.auth
    }); 
}

function prSource() {
    console.log(JSON.stringify({
          "title": "Contributing to: " + GH.filename,
          "body": "Adding/Updating " + GH.filename,
          "head": GH.userName.split('/')[0] + ":" + GH.userRef,
          "base": "master"
        }));
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: JSON.stringify({
          "title": "Contributing to: " + GH.filename,
          "body": "Adding/Updating " + GH.filename,
          "head": GH.userName.split('/')[0] + ":" + GH.userRef,
          "base": "master"
        }),
        dataType: 'json',
        success: function (data) {
            sourceSaved();
        },
        error: function() {
            console.log('FAIL');
        },
        type: 'POST',
        url: GH.base + 'repos/openaddresses/openaddresses/pulls' + GH.auth
    }); 
}

function sourceSaved() {
    swal({
        title: "Saved!",
        text: "Your changes are awaiting review",
        type: "success",
        confirmButtonText: "Continue",
        closeOnConfirm: false 
    }, function() {
        $('.content').ready(function() { $(".content").load("blocks/contribute-main-help.html"); });
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