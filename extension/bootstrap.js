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
    "view-bookmarks-sidebar": false,
    "view-pocket-list": false,
    "show-all-bookmarks-top": false,
    "subscribe-to-this-page": false,
    "bookmarks-toolbar": false,
    "view-bookmarks-toolbar": false,
    "unsorted-bookmarks": false,
    "reading-list": false,
    "show-all-bookmarks": 1,
    "bookmark-this-page": true,
    "open-all-in-tabs": false,
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
        var h_rules = [];

        var vbs = this.prefs.getBoolPref("view-bookmarks-sidebar");
        if (vbs === false) {
            h_rules.push("#BMB_viewBookmarksSidebar");
            h_rules.push("#BMB_viewBookmarksSidebar + menuseparator");
            h_rules.push("#panelMenu_viewBookmarksSidebar");
        }

        if (this.prefs.getBoolPref("view-pocket-list") === false) {
            h_rules.push("#BMB_pocket");
            h_rules.push("#BMB_pocket + menuseparator");
            h_rules.push("#panelMenu_pocket");
            h_rules.push("#panelMenu_pocket + toolbarseparator");
        }

        if (this.prefs.getBoolPref("show-all-bookmarks-top") === false) {
            h_rules.push("#BMB_bookmarksShowAllTop");
            if (vbs === false) {
                h_rules.push("#BMB_bookmarksShowAllTop + menuseparator");
            }
        }

        if (this.prefs.getBoolPref("subscribe-to-this-page") === false) {
            h_rules.push("#BMB_subscribeToPageMenuitem");
            h_rules.push("#BMB_subscribeToPageMenuitem + menuseparator");
            h_rules.push("#BMB_subscribeToPageMenupopup");
            h_rules.push("#BMB_subscribeToPageMenupopup + menuseparator");
        }

        var bt = this.prefs.getBoolPref("bookmarks-toolbar");
        if (bt === false) {
            h_rules.push("#BMB_bookmarksToolbar");
            h_rules.push("#panelMenu_bookmarksToolbar");
        }

        if (this.prefs.getBoolPref("view-bookmarks-toolbar") === false) {
            h_rules.push("#BMB_viewBookmarksToolbar");
            h_rules.push("#BMB_viewBookmarksToolbar + menuseparator");
            h_rules.push("#panelMenu_viewBookmarksToolbar");
            if (vbs === false) {
                h_rules.push("#panelMenu_viewBookmarksToolbar + toolbarseparator");
            }
        }

        if (this.prefs.getBoolPref("unsorted-bookmarks") === false) {
            h_rules.push("#BMB_unsortedBookmarks");
            h_rules.push("#panelMenu_unsortedBookmarks");
            if (bt === false) {
                h_rules.push("#BMB_unsortedBookmarks + menuseparator");
                h_rules.push("#panelMenu_unsortedBookmarks + toolbarseparator");
            }
        }

        if (this.prefs.getBoolPref("reading-list") === false) {
            h_rules.push("#BMB_readingList");
            h_rules.push("#BMB_readingList + menuseparator");
            h_rules.push("#panelMenu_viewReadingListSidebar");
            h_rules.push("#panelMenu_viewReadingListSidebar + toolbarseparator");
        }

        var sab = this.prefs.getIntPref("show-all-bookmarks");
        if (sab === 2) {
            h_rules.push("#BMB_bookmarksShowAll");
            h_rules.push("#panelMenu_showAllBookmarks");
            src = src + ".cui-widget-panel > .panel-arrowcontainer > .panel-arrowcontent {padding-bottom: 4px !important;}" + "\n";
        }
        else if (sab === 1) {
            h_rules.push("#BMB_bookmarksShowAll .menu-iconic-left");
            h_rules.push("#BMB_bookmarksShowAll .menu-accel-container");
            src = src + "#BMB_bookmarksShowAll .menu-text { padding-left: 0 !important; padding-right: 0 !important;}" + "\n";
            src = src + "#BMB_bookmarksShowAll .menu-iconic-text { text-align: center; margin-left: 0 !important; margin-right: 0 !important;}" + "\n";
        }

        if (this.prefs.getBoolPref("bookmark-this-page") === false) {
            h_rules.push("#panelMenuBookmarkThisPage");
            h_rules.push("#panelMenuBookmarkThisPage + toolbarseparator");
        }

        if (this.prefs.getBoolPref("open-all-in-tabs") === false) {
            h_rules.push("#BMB_bookmarksPopup .openintabs-menuitem");
            src = src + "#BMB_bookmarksPopup menupopup[placespopup=true] > hbox > .popup-internal-box > .arrowscrollbox-scrollbox > .scrollbox-innerbox {padding-bottom: 4px !important;}" + "\n";
        }

        src = src + h_rules.join(", ");
        src = src + " {display: none !important;}";
        src = src + STYLESHEET_FOOTER;

        return "data:text/css;charset=utf-8," + encodeURIComponent(src);
    },

    init: function() {
        this.setDefaultPrefs();

        this.prefs = Cc["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefService)
                       .getBranch(this.PREF_BRANCH);

        this.stylesheet = this.genStyleSheet();
        this.loadStyle(this.stylesheet);

        this.prefs.addObserver("", this, false);
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
