/*jshint jquery:true,browser:true,curly: false */
var GH = {
  base: 'https://api.github.com/',
  masterRef: 'openaddresses/openaddresses/git/refs/heads/master',
  currentSource: {},
  filename: '',
  auth: (localStorage.hello) ?
    '?access_token=' + JSON.parse(localStorage.hello).github.access_token :
    '?access_token=' + localStorage.token
};

var newSource = false;
var sidebarList = {};

function setStatus() {
  //Set status by getting list of sources from data.openaddresses.io
  $.ajax({
    url: "http://data.openaddresses.io/state.json",
    type: "GET",
    crossDomain: true,
    success: function(res) {
      $.ajax({
        url: "http://data.openaddresses.io/" + res,
        type: "GET",
        crossDomain: true,
        success: function(status) {
          console.log(status);
        },
        error: function(xhr, status) {
          console.error(status);
        }
      });
    },
    error: function(xhr, status) {
      console.error(status);
    }
  });
}

function filter(query) {
  query = query.replace(/[-_\ ]/g, '');
  var lists = sidebarList.sources.filter(function(list) {
    return list.name.replace(/[-_\ ]*/g, '').indexOf(query) !== -1;
  });
  renderSidebar({
    "sources": lists
  });
}

function renderSidebar(list) {
  $.get('../blocks/contribute-sidebar.mst', function(template) {
    $('.sidebar').removeClass('loading');
    $('.sidebar-content').html(Mustache.render(template, list));

    $('.buttonContainer').off().on('click', function() {
      if ($(this).hasClass('newSource')) {
        newSource = true;
        GH.filename = "NewSource.json";
        renderSource({
          filename: "NewSource.json"
        });
      } else $(this).each(function(index) {
        if (index === 0) loadSource($(this).text().trim());
      });
    });
  });
}

//If a source is clicked on, load it from GH
function loadSource(name) {
  $.get(GH.base + 'repos/openaddresses/openaddresses/contents/sources/' + name + GH.auth, function(sourceRaw) {
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
  if ($('.sourceCompression option:selected').val() !== 'none') {
    GH.currentSource.type = $('.sourceType option:selected').val();
  }
}

function renderSource(source) {
  $.get('../blocks/contribute-main-edit.mst', function(template) {
    $('.content').html(Mustache.render(template, source));
    if (source.type) $('.type > .' + source.type).prop('selected', true);

    if (source.compression) $('.compression > .' + source.compression).prop('selected', true);
    else if (source.data && !source.compression) $('.compression > .none').prop('selected', true);

    $('.paneTitle').hover(function() {
      $(this).find('> .helpIcon').css('display', 'block');
    }, function() {
      $(this).find('> .helpIcon').css('display', 'none');
    });
    $('.actionClose').on('click', function() {
      window.confirm('Are you sure? your changes will be lost', function() {
        $('.content').html('');
      });
      return false;
    });
    $('.actionSave').click(createBranch);
    $('.help').click(help);
  });
}

function help() {
  var helpText = {};

  if ($(this).hasClass('helpData')) {
    helpText.title = "Data Tag";
    helpText.text = "Link to the raw data";
  } else if ($(this).hasClass('helpWebsite')) {
    helpText.title = "Website Tag";
    helpText.text = "Link to human readable web portal";
  } else if ($(this).hasClass('helpAttribution')) {
    helpText.title = "Attribution Tag";
    helpText.text = "If the source requests attribution";
  } else if ($(this).hasClass('helpType')) {
    helpText.title = "Type Tag";
    helpText.text = "The protocol used to download the file";
  } else if ($(this).hasClass('helpCompression')) {
    helpText.title = "Compression Tag";
    helpText.text = "Is the source within a zipfile?";
  } else if ($(this).hasClass('helpLicense')) {
    helpText.title = "License Tag";
    helpText.text = "If a license is listed for the file either link to it or put the name of it here";
  } else if ($(this).hasClass('helpNote')) {
    helpText.title = "Note Tag";
    helpText.text = "Any notes about the source can be added here";
  } else {
    helpText.title = "Help Docs";
    helpText.text = "We don't have specific help on this tag";
  }

  window.alert(htmlText.text);
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
    success: function(data) {
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
    success: function(data) {
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
    success: function(data) {
      window.alert('Saved! Your changes are awaiting review.');
    },
    error: function() {
      window.alert('Sorry, not saved. There was an error.');
    },
    type: 'POST',
    url: GH.base + 'repos/openaddresses/openaddresses/pulls' + GH.auth
  });
}

function load() {
  //Ensure fork exists in user account
  $.get(GH.base + 'repos/' + GH.masterRef + GH.auth, function(data) {
    GH.masterSha = data.object.sha;
    //Fork oa/oa into user account
    $.post(GH.base + 'repos/openaddresses/openaddresses/forks' + GH.auth, function(data) {
      GH.userName = data.full_name;
    });
  });

  //Create Sidebar by getting list of sources from GH
  $.get(GH.base + 'repos/openaddresses/openaddresses/contents/sources' + GH.auth, function(data) {
    sidebarList = {
      'sources': data.filter(function(source) {
        return source.name.indexOf('.json') !== -1;
      })
    };
    sidebarList.sources = sidebarList.sources.map(function(source) {
      source.country = source.name.split('-')[0];
      return source;
    });
    renderSidebar(sidebarList);
    setStatus();
  });

  $('#filter').keyup(function() {
    filter($(this).val());
  });

  $('.js-logout').click(function() {
    delete localStorage.hello;
    delete localStorage.token;
    window.location.reload();
  });
}

if (localStorage.hello || localStorage.token) {
  $(load);
} else {
  window.location.href = '/login/';
}
