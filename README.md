openaddresses.io
---

This is the website for the [OpenAddresses project](https://github.com/openaddresses/openaddresses/).

### Previewing changes to the site

There is no need to install Ruby or Jekyll to make or preview simple site edits.

Make your changes in a branch, and issue a pull request. Your edits will be
visible in [Precog](https://precog.mapzen.com), a service for previewing your
static websites built with CircleCI before making them live. Look for a link
to preview changes in Github’s Pull Request screen:

![Sample pull request status checks](img/_precog.png)

### Running the site locally

You'll need to install [Jekyll](http://jekyllrb.com/) then run the command:

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
