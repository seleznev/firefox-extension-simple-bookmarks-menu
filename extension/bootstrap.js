/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");

const XUL_NAMESPACE = "@namespace url(\"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul\");";
const STYLESHEET_HEADER = "@-moz-document url(\"chrome://browser/content/browser.xul\") {";
const STYLESHEET_FOOTER = "}";

const DefaultPrefs = {
    "bookmark-this-page": true,
    "view-bookmarks-sidebar": false,
    "view-bookmarks-toolbar": false,
    "subscribe-to-this-page": false,
    "bookmarks-toolbar": false,
    "unsorted-bookmarks": false,
    "show-all-bookmarks": 1,
    "keyboard-shortcuts": false,
}

var SimpleBookmarksMenu = {
    PREF_BRANCH: "extensions.simple-bookmarks-menu.",
    prefs: null,

    stylesheet: '',

    setDefaultPrefs: function() {
        let branch = Services.prefs.getDefaultBranch(this.PREF_BRANCH);
        for (let [key, val] in Iterator(DefaultPrefs)) {
            switch (typeof val) {
            case "boolean":
                branch.setBoolPref(key, val);
                break;
            case "number":
                branch.setIntPref(key, val);
                break;
            case "string":
                branch.setCharPref(key, val);
                break;
            }
        }
    },

    loadStyle: function(stylesheet) {
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        let uri = Services.io.newURI(stylesheet, null, null);
        if (!sss.sheetRegistered(uri, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
    },

    unloadStyle: function(stylesheet) {
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        let uri = Services.io.newURI(stylesheet, null, null);
        if (sss.sheetRegistered(uri, sss.USER_SHEET))
            sss.unregisterSheet(uri, sss.USER_SHEET);
    },

    observe: function(subject, topic, data) {
        if (topic != "nsPref:changed")
            return;

        this.unloadStyle(this.stylesheet);
        this.stylesheet = this.genStyleSheet();
        this.loadStyle(this.stylesheet);
    },

    genStyleSheet: function() {
        var src = XUL_NAMESPACE + "\n" + STYLESHEET_HEADER + "\n";

        if (this.prefs.getBoolPref("bookmark-this-page") === false) {
            src = src + "#panelMenuBookmarkThisPage {display: none !important;}" + "\n";
            src = src + "#panelMenuBookmarkThisPage + toolbarseparator {display: none !important;}" + "\n";
        }

        var vbs = this.prefs.getBoolPref("view-bookmarks-sidebar");
        if (vbs === false) {
            src = src + "#BMB_viewBookmarksSidebar {display: none !important;}" + "\n";
            src = src + "#BMB_viewBookmarksSidebar + menuseparator {display: none !important;}" + "\n";
            src = src + "#panelMenu_viewBookmarksSidebar {display: none !important;}" + "\n";
        }

        var vbt = this.prefs.getBoolPref("view-bookmarks-toolbar");
        if (vbt === false) {
            src = src + "#panelMenu_viewBookmarksToolbar {display: none !important;}" + "\n";
        }

        if (vbs === false && vbt === false) {
            src = src + "#panelMenu_viewBookmarksToolbar + toolbarseparator {display: none !important;}" + "\n";
        }

        if (this.prefs.getBoolPref("subscribe-to-this-page") === false) {
            src = src + "#BMB_subscribeToPageMenuitem, #BMB_subscribeToPageMenupopup {display: none !important;}" + "\n";
            src = src + ":-moz-any(#BMB_subscribeToPageMenuitem, #BMB_subscribeToPageMenupopup) + menuseparator {display: none !important;}" + "\n";
        }

        var bt = this.prefs.getBoolPref("bookmarks-toolbar");
        if (bt === false) {
            src = src + "#BMB_bookmarksToolbar, #panelMenu_bookmarksToolbar {display: none !important;}" + "\n";
        }

        var ub = this.prefs.getBoolPref("unsorted-bookmarks");
        if (ub === false) {
            src = src + "#BMB_unsortedBookmarks, #panelMenu_unsortedBookmarks {display: none !important;}" + "\n";
        }

        if (bt === false && ub === false) {
            src = src + "#BMB_unsortedBookmarks + menuseparator {display: none !important;}" + "\n";
            src = src + "#panelMenu_unsortedBookmarks + toolbarseparator {display: none !important;}" + "\n";
        }

        var sab = this.prefs.getIntPref("show-all-bookmarks");
        if (sab === 2) {
            src = src + "#BMB_bookmarksShowAll, #panelMenu_showAllBookmarks {display: none !important;}" + "\n";
            src = src + ".cui-widget-panel > .panel-arrowcontainer > .panel-arrowcontent {padding-bottom: 4px !important;}" + "\n";
        }
        else if (sab === 1) {
            src = src + "#BMB_bookmarksShowAll .menu-accel-container {display: none !important;}" + "\n";
            src = src + "#BMB_bookmarksShowAll { text-align: center; -moz-margin-start: -18px !important;}" + "\n";
        }

        src = src + STYLESHEET_FOOTER;
        return "data:text/css;charset=utf-8," + encodeURIComponent(src);
    },

    init: function() {
        this.setDefaultPrefs();

        this.prefs = Cc["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefService)
                       .getBranch(this.PREF_BRANCH);

        this.prefs.addObserver("", this, false);

        this.stylesheet = this.genStyleSheet();
        this.loadStyle(this.stylesheet);
    },

    uninit: function() {
        this.unloadStyle(this.stylesheet);
        this.prefs.removeObserver("", this);
    },
}

function startup(data, reason) {
    SimpleBookmarksMenu.init();
}

function shutdown(data, reason) {
    if (reason == APP_SHUTDOWN)
        return;

    SimpleBookmarksMenu.uninit();
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
