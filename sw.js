/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  importScripts("sw-notifications.js");
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "sw-notifications.js",
    "revision": "e9fdf9d6e948d5ded5dd5553f25307de"
  }, {
    "url": "registerSW.js",
    "revision": "9718dc9c35e4c5bdcfd13a1b94823824"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "25caaccd3b4a60a869f13da6f031cd4f"
  }, {
    "url": "pwa-512x512.png",
    "revision": "25caaccd3b4a60a869f13da6f031cd4f"
  }, {
    "url": "pwa-192x192.png",
    "revision": "34b1b96801e73344c2ede13fcef749f9"
  }, {
    "url": "index.html",
    "revision": "04fb3c690ea510a47cce675e23b3af05"
  }, {
    "url": "icon.svg",
    "revision": "c23df3289b57886be0018d24ee11d65d"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ada11211724bca51a8bcadd52f3c784f"
  }, {
    "url": "404.html",
    "revision": "d86693cdc26f216494e4c7120091313b"
  }, {
    "url": "assets/index-DqMZOqTS.js",
    "revision": null
  }, {
    "url": "assets/index-DYqOtuZ0.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ada11211724bca51a8bcadd52f3c784f"
  }, {
    "url": "icon.svg",
    "revision": "c23df3289b57886be0018d24ee11d65d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "34b1b96801e73344c2ede13fcef749f9"
  }, {
    "url": "pwa-512x512.png",
    "revision": "25caaccd3b4a60a869f13da6f031cd4f"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "25caaccd3b4a60a869f13da6f031cd4f"
  }, {
    "url": "sw-notifications.js",
    "revision": "e9fdf9d6e948d5ded5dd5553f25307de"
  }, {
    "url": "manifest.webmanifest",
    "revision": "e33978dcb561fcb68cc016e1e926b69f"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
