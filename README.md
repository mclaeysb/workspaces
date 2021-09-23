# Manuel Rates Workspaces

## What this is

Occasionnally I work from home or in a café in town. It's not frequent enough to join a co-working space, but it is frequent enough to need a list of good workspaces readily available. Good places to work from can be rare rare, and finding one can feel like finding a gem in the rough. Over the years, I seem to have developed a particular taste, with some specific criteria that can make or break a workspace for me.

I made this little website just for fun. Credits to ['Tom Rates Hills'](https://macwright.org/hills/) for inspiring this side project.

## How to run it locally

To edit this webmap, open the `index.html`, `map.js` and `style.css` files in a text editor.

The JavaScript in `map.js` uses `require()` load npm modules. Run `npm install` to install all modules specified in `package.json`, then `watchify map.js -o bundle.js` to automatically `browserify` all the required code into the one `bundle.js` file that is updated every time alter your JS code, and loaded in `index.html`.

To view this webmap, start a local http server and open the `index.html` file in you browser (for example using [npm's `http-server`](https://www.npmjs.com/package/http-server) and running `http-server -o`).
