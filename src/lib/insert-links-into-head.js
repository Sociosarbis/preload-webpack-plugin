/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const UglifyJS = require('uglify-js');
const createHTMLElementString = require('./create-html-element-string');

function createLinksInjectionScript(links, delay) {
  return `<script>
  ${UglifyJS.minify(`if (!window.__PRELOAD_WEBPACK_PLUGIN_TIMERIDS__) {
    window.__PRELOAD_WEBPACK_PLUGIN_TIMERIDS__ = [];
  }
  (function () {
    var timerId = setTimeout(function () {
      var links = ${JSON.stringify(links)};
      links.forEach(function (link) {
        var linkEl = document.createElement('link');
        var attributes = link.attributes;
        Object.keys(attributes).forEach(function (key) { linkEl.setAttribute(key, attributes[key]) });
        document.head.appendChild(linkEl);
      })
      var index = window.__PRELOAD_WEBPACK_PLUGIN_TIMERIDS__.indexOf(timerId);
      if (index !== -1) {
        window.__PRELOAD_WEBPACK_PLUGIN_TIMERIDS__.splice(index, 1);
      }
    }, ${delay});
    window.__PRELOAD_WEBPACK_PLUGIN_TIMERIDS__.push(timerId);
  })()`
  ).code
}
  </script>`;
}

function insertLinksIntoHead({html, links = [], delay}) {
  if (links.length === 0) {
    return html;
  }

  const content =
    typeof delay === 'undefined'
      ? links.map((link) => typeof link === 'string' ? link : createHTMLElementString(link)).join('')
      : createLinksInjectionScript(links, delay);

  if (html.includes('</head>')) {
    // If a valid closing </head> is found, insert the new <link>s right before it.
    return html.replace('</head>', content + '</head>');
  }

  if (html.includes('<body>')) {
    // If there's a <body> but no <head>, create a <head> containing the <head>.
    return html.replace('<body>', `<head>${content}\n</head><body>`);
  }

  throw new Error(`The HTML provided did not contain a </head> or a <body>:\n\n${html}`);
}

module.exports = insertLinksIntoHead;
