openaddresses.io
---

This is the website for the OpenAddresses project, that aims to compile an index of
free and open data for street addresses.


### Running the site locally

You'll need to install [Jekyll](http://jekyllrb.com/) then run the command.

    jekyll serve --watch

OpenAddresses.io uses a proxy server to manage Oauth between itself and GitHub.
[hello.js](http://adodson.com/hello.js/#hellojs) is used to manage the
authentication flow. To authenticate locally, you'll first need to authenticate
on the [live site](http://openaddresses.io). Next type the following command
in your browser's console window and press return:

    localStorage.hello

Look for the key `access_token` and copy its value. Next, run openaddresses.io
and type the following command in your browser's console window and press return:


    localStorage.token = 'ACCESS TOKEN VALUE'

Refresh the page and you should be authenticated with GitHub.
