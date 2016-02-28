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
