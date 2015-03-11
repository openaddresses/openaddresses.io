---
---

/*jshint jquery:true,browser:true,curly: false */
var GH = {
    base: 'https://api.github.com/',
    masterRef: 'openaddresses/openaddresses/git/refs/heads/master',
    currentSource: {},
    filename: '',
    auth: (localStorage.hello) ?
        '?access_token=' + JSON.parse(localStorage.hello).github.access_token : '?access_token=' + localStorage.token
};

var newSource = false;
var sidebarList = {};

function setStatus() {
    //Set status by getting list of sources from data.openaddresses.io
    $.ajax({
        url: 'http://data.openaddresses.io/state.json',
        type: 'GET',
        crossDomain: true,
        success: function (res) {
            $.ajax({
                url: 'http://data.openaddresses.io/' + res,
                type: 'GET',
                crossDomain: true,
                success: function (status) {
                    console.log(status);
                },
                error: function (xhr, status) {
                    console.error(status);
                }
            });
        },
        error: function (xhr, status) {
            console.error(status);
        }
    });
}

function filter(query) {
    query = query.replace(/[-_\ ]/g, '');
    var lists = sidebarList.sources.filter(function (list) {
        return list.name.replace(/[-_\ ]*/g, '').indexOf(query) !== -1;
    });
    renderSidebar({
        'sources': lists
    });
}

function renderSidebar(list) {
    $.get('../blocks/contribute-sidebar.mst', function (template) {
        $('.sidebar').find('.overlay').remove();
        $('.sidebar-content').html(Mustache.render(template, list));

        $('.js-add-source').on('click', function () {
            GH.currentSource = {};
            newSource = true;
            GH.filename = 'NewSource.json';
            renderSource({
                filename: 'Add new source'
            });
            return false;
        });

        $('.js-data-source').on('click', function () {
            newSource = false;
            // Toggle an active class.
            $('.js-data-source').removeClass('active');
            $(this).addClass('active');

            $(this).each(function (index) {
                if (index === 0) loadSource($(this).text().trim());
            });
            return false;
        });
    });
}

//If a source is clicked on, load it from GH
function loadSource(name) {
    $.get(GH.base + 'repos/openaddresses/openaddresses/contents/sources/' + name + GH.auth, function (sourceRaw) {
        GH.currentSource = JSON.parse(atob(sourceRaw.content));
        GH.sha = sourceRaw.sha;
        GH.currentSource.filename = 'Edit ' + name;
        renderSource(GH.currentSource);
    });
}

function getValues() {
    if (newSource) GH.currentSource.coverage = {};
    GH.currentSource.data = $('#source-data').val();
    GH.currentSource.website = $('#source-website').val();
    GH.currentSource.attribution = $('#source-attribution').val();
    if ($('#source-type option:selected').val() !== 'none') {
        GH.currentSource.type = $('#source-type option:selected').val();
    }
    if ($('#source-compression option:selected').val() !== 'none') {
        GH.currentSource.compression = $('#source-compression option:selected').val();
    }
    GH.currentSource.coverage.country = $('#source-coverage-country').val();
    GH.currentSource.coverage.state = $('#source-coverage-state').val();
    GH.currentSource.coverage.city = $('#source-coverage-city').val();

    if (newSource) {
        GH.filename = GH.currentSource.coverage.country;
        if (GH.currentSource.coverage.state) GH.filename = GH.filename + "-" + GH.currentSource.coverage.state;
        if (GH.currentSource.coverage.city) GH.filename = GH.filename + "-" + GH.currentSource.coverage.city;
        GH.filename = GH.filename.toLowerCase().replace(' ', '_', 'g') + ".json";
    }

}

function renderSource(source) {
    $.get('../blocks/contribute-main-edit.mst', function (template) {
        $('.content').html(Mustache.render(template, source));
        // Render select option values.
        if (source.type) $('#source-type > .' + source.type).prop('selected', true);
        if (source.compression) $('#source-compression > .' + source.compression).prop('selected', true);
        else if (source.data && !source.compression) $('#source-compression > .none').prop('selected', true);

        $('.js-close').on('click', function () {
            $('.js-data-source').removeClass('active');
            $('.content').html('&nbsp;');
            return false;
        });

        $('.js-save').click(createBranch);
    });
}

function createBranch() {
    GH.userRef = Date.now();
    //Create branch that references oa/oa/ref/master
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: JSON.stringify({
            'ref': 'refs/heads/' + GH.userRef,
            'sha': GH.masterSha
        }),
        dataType: 'json',
        success: function (data) {
            saveSource();
        },
        error: function () {
            console.log('FAIL');
        },
        processData: false,
        type: 'POST',
        url: GH.base + 'repos/' + GH.userName + '/git/refs' + GH.auth
    });

    return false;
}

function saveSource() {
    getValues();
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: JSON.stringify({
            'message': 'Add ' + GH.filename,
            'path': 'sources/' + GH.filename,
            'content': btoa(JSON.stringify(GH.currentSource, null, 4)),
            'branch': '' + GH.userRef,
            'sha': GH.sha ? GH.sha : ""
        }),
        dataType: 'json',
        success: function (data) {
            prSource();
        },
        error: function () {
            console.log('FAIL');
        },
        type: 'PUT',
        url: GH.base + 'repos/' + GH.userName + '/contents/sources/' + GH.filename + GH.auth
    });
}

function prSource() {
    console.log(JSON.stringify({
        'title': 'Contributing to: ' + GH.filename,
        'body': 'Adding/Updating ' + GH.filename,
        'head': GH.userName.split('/')[0] + ":" + GH.userRef,
        'base': 'master'
    }));
    $.ajax({
        contentType: 'application/json',
        crossDomain: true,
        data: JSON.stringify({
            'title': 'Contributing to: ' + GH.filename,
            'body': 'Adding/Updating ' + GH.filename,
            'head': GH.userName.split('/')[0] + ":" + GH.userRef,
            'base': 'master'
        }),
        dataType: 'json',
        success: function (data) {
            window.alert('Saved! Your changes are awaiting review.');
        },
        error: function () {
            window.alert('Sorry, not saved. There was an error.');
        },
        type: 'POST',
        url: GH.base + 'repos/openaddresses/openaddresses/pulls' + GH.auth
    });
}

function load() {
    //Ensure fork exists in user account
    $.get(GH.base + 'repos/' + GH.masterRef + GH.auth, function (data) {
        GH.masterSha = data.object.sha;
        //Fork oa/oa into user account
        $.post(GH.base + 'repos/openaddresses/openaddresses/forks' + GH.auth, function (data) {
            GH.userName = data.full_name;
        });
    });

    //Create Sidebar by getting list of sources from GH
    $.get(GH.base + 'repos/openaddresses/openaddresses/contents/sources' + GH.auth, function (data) {
        sidebarList = {
            'sources': data.filter(function (source) {
                return source.name.indexOf('.json') !== -1;
            })
        };
        sidebarList.sources = sidebarList.sources.map(function (source) {
            source.country = source.name.split('-')[0];
            return source;
        });
        renderSidebar(sidebarList);
        setStatus();
    });

    $('#filter').keyup(function () {
        filter($(this).val());
    });

    $('.js-logout').click(function () {
        delete localStorage.hello;
        delete localStorage.token;
        window.location.reload();
    });
}

if (localStorage.hello || localStorage.token) {
    $(load);
} else {
    window.location.href = '{{site.baseurl}}/login/';
}
