# Markwhen timeline

## Installation and running

Requirements:

Node > 18, `npm`

```
git clone https://github.com/mark-when/timeline.git
cd timeline
npm i
npm run dev
```

The timeline will run from port 6180 and will automatically be detected by Meridiem, whether it's the web app or the desktop app. Any port between 6180 and 6280 will be picked up - Meridiem looks for a `mw.json` file at all of these ports and if it finds one adds it to the list of available views. If it's not detected you can rescan for it or add it directly with the `Add by url` form.

![](/timeline.png)

If you wanted to change this preview panel you can merely edit `public/mw.json`.

## Building

`npm run build`

Aside from assets like the screenshots and `mw.json`, this bundles all html/css/js into a single index.html file at `dist/index.html`

[More documentation](https://docs.markwhen.com)

[Parser](https://github.com/mark-when/parser)

[View client](https://github.com/mark-when/view-client)
