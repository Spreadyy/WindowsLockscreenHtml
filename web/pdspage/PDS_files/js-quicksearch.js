
/* -------- ~assets/QuickSearch/module.js -------- */
;
/* jslint devel: true, browser: true, eqeq: true, es5: true, vars: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
(function($) {

    var core = $.registerNamespace("GridSoft");
    var queryString = $.registerNamespace("GridSoft.GridWorks.Core.QueryString");
    var ns = $.registerNamespace("GridSoft.GridWorks.QuickSearch");

    $.extend(ns, {

        tabs: {},

        loadedTabs: {},

        initialise: function() {
            
            ns.baseUrl = core.baseUrl + "QuickSearch/";

            ns.container = $("#gs-quicksearch");
            if (ns.container.length < 1) {
                return;
            }

            ns.mode = ns.container.data("mode");
            ns.toggle = $.findOne("#gs-quicksearch-toggle");

            ns.link = $.findOne(".gs-searchcenter-link");
            ns.link.click(function(e) {
                console.log("quicksearch :: search center link clicked.");
                e.preventDefault();
                ns.redirectToSearchCenter();
            });

            switch (ns.mode) {
                case "tabs":
                    ns.toggle.tabs({
                        cookie: "searchbox",
                        hide: false,
                        show: false,
                        activate: function(event, ui) {
                            if (ui) {
                                var name = ui.newPanel.attr("id").replace("gs-quicksearch-", "");
                                ns.setSelectedTab(name);
                            }
                        }
                    });
                    break;

                case "dropdown":
                    ns.select = $.findOne("#gs-quicksearch-select");
                    
                    ns.select.bind("change", function (e) {
                        var name = $(this).find("option:selected").data("tabname");
                        ns.setSelectedTab(name);
                    });

                    var selected = ns.select.find("option:selected").data("tabname");
                    setTimeout(function() {
                        ns.setSelectedTab(selected, false);
                    }, 0);
                    break;
            }
            
            ns.container.show();

            $.publish("QuickSearch:Ready");
            ns.ready = true;

            // parse query string, if it contains k=someTerm*
            // initialise static term.
            var term = queryString.params["k"];
            if (term) {
                setTimeout(function() {
                    $.publish("QuickSearch:UpdateTerm", [term]);
                }, 50);
            }
        },

        setSelectedTab: function (name, setFocus) {
            console.log("quicksearch :: setSelectedTab %s", name);

            if (ns.mode == "dropdown") {
                $(".gs-quicksearch-panel").hide();
                $("[data-gridworks-quicksearch-name=" + name + "]").css("display", "inline");
            }

            if (setFocus === false) {
                return;
            }

            var fn = function () {
                var tab = ns.loadedTabs[name];
                tab.setFocus(focus);
            };

            if (ns.loadedTabs[name] == null) {
                // wait until module ready event is published, then activate tab.
                $.subscribe("QuickSearch:" + name + ":Ready", fn);
            } else {
                fn();
            }
        },

        getSelectedTab: function() {
            if (!ns.ready) {
                return null;
            }

            var name = null;
            switch (ns.mode) {
                case "tabs":
                    name = ns.toggle.find("li.ui-state-active a").attr("href").replace("#gs-quicksearch-", "");
                    break;

                case "dropdown":
                    name = ns.select.find("option:selected").data("tabname");
                    break;
            }

            return name != null ? ns.loadedTabs[name] : null;
        },
            
        redirectToSearchCenter: function(url) {
            if (!ns.ready) {
                console.log("quicksearch :: module not ready.");
                return;
            }
                
            if (url == null) {
                var tab = ns.getSelectedTab();
                if (tab != null && $.isFunction(tab.getSearchCenterUrl)) {
                    url = tab.getSearchCenterUrl();
                }
            }

            url = url || ns.Config.SearchCenterUrl;

            location.href = url;
        },
            
        getConfig: function(name, tab) {
            ns.loadedTabs[name] = tab;

            var o = { SearchCenterUrl: ns.Config.SearchCenterUrl };
            $.each(ns.Config.Tabs, function() {
                if (this.Name == name) {
                    $.extend(o, this);
                }
            });
            return o;
        }
    });

    $(function() {
        ns.initialise();
    });

})(jQuery);
/* -------- ~assets/QuickSearch/content.js -------- */
;
/* jslint devel: true, browser: true, eqeq: true, es5: true, vars: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
;(function($) {   
    
    var core = $.registerNamespace("GridSoft.GridWorks.Core");
    var quicksearch = $.registerNamespace("GridSoft.GridWorks.QuickSearch");
    var ns = $.registerNamespace("GridSoft.GridWorks.QuickSearch.Content");
    
    $.extend(ns, {

        initialise: function () {
            ns.container = $("#gs-quicksearch");
            if (ns.container.length < 1) {
                return;
            }

            console.log("quicksearch.content :: initialise ...");

            // use html5 data attributes to declare content tabs.
            $("[data-gridworks-quicksearch-type=contenttab]").each(function () {
                var tab = $(this);
                var name = tab.data("gridworks-quicksearch-name");
                    
                // setup configuration object, which is a combination of
                // - configuration of quicksearch module
                // - configuration of content tab
                // - overrides passed along in this call.
                tab.o = quicksearch.getConfig(name, tab);
                tab.o.ServiceUrl = window._spPageContextInfo.webAbsoluteUrl + tab.o.ServiceUrl;
                    
                tab.input = tab.findOne("input");
                tab.loading = tab.findOne(".loading");
                tab.results = tab.findOne(".results");

                switch (quicksearch.mode) {
                    case "tabs":
                        tab.select = tab.findOne("select");
                        break;

                    default:
                        tab.select = quicksearch.select;
                        break;
                }

                tab.input.keydown(function (event) {
                    var keyCode = $.ui.keyCode;
                    switch (event.keyCode) {
                        case keyCode.ENTER:
                            quicksearch.redirectToSearchCenter();
                            return false;
                    }
                    return true;
                });
                tab.input.keydown(function(event) {
                });

                tab.input.autocomplete({
                    minLength: tab.o.MinLength,
                    appendTo: tab.results,
                    select: function (event, ui) {
                        location.href = ui.item.value;
                        return false;
                    },
                    source: function (request, response) {
                        
                        var term = tab.getTerm();
                        if (term.length > 0) {
                            $.publish("QuickSearch:UpdateTerm", [term]);

                            var option = tab.select.find("option:selected");
                            var queryTitle = option.attr("value");
                            var tabName = option.attr("tabName");

                            var data = {
                                term: ns.addWildCard(term),
                                queryTitle: queryTitle,
                                tabName: tabName
                            };
                        
                            tab.loading.show();
                            tab.results.hide();
                            
                            $.ajax({
                                cache: false,
                                url: tab.o.ServiceUrl,
                                type: "GET",
                                dataType: "json",
                                data: data,
                                success: function (result) {
                                    response(result);
                                },
                                error: function (xhr, status, errorThrown) {
                                    console.error("service failure: status: ", status, ", errorThrown: ", errorThrown, ", responseText: ", xhr.responseText.substring(0, 200));
                                    
                                    tab.loading.hide();
                                    tab.results.show();
                                }
                            });
                        }
                        
                        return;
                    },
                    close: function () {
                        tab.results.hide();
                    }
                });

                var autocomplete = tab.input.data("uiAutocomplete");

                autocomplete.__response = function (content) {
                    if (!this.options.disabled) {
                        content = this._normalize(content);
                        this._suggest(content);
                        this._trigger("open");
                        this.pending--;
                    }
                    if (!this.pending) {
                        this.element.removeClass("ui-autocomplete-loading");
                    }
                };

                autocomplete._resizeMenu = function () {};

                autocomplete._suggest = function (results) {
                    var ul = this.menu.element.empty();
                    var items = [], rowCount = 0, totalRows = 0;
                    var meta = {
                        "type": "total",
                        "line2": tab.o.MoreResultsDescription,
                        "value": tab.getSearchCenterUrl()
                    };

                    $.each(results, function (key, value) {
                        rowCount += value.RowCount;
                        totalRows += value.TotalRows;
                        $.each(value.Result, function () {
                            items.push(ns.normalize(this));
                        });
                    });
                    meta.label = tab.o.MoreResultsLabel.replace("{rowCount}", rowCount).replace("{totalRows}", totalRows);
                    items.push(meta);

                    this._renderMenu(ul, items);
                    this.menu.refresh();

                    tab.loading.hide();
                    tab.results.show();

                    ul.show();

                    if (this.options.autoFocus) {
                        this.menu.next(new $.Event("mouseover"));
                    }
                };

                autocomplete._renderItem = function (ul, item) {
                    return $('<li class="ui-menu-item-' + item.type.toLowerCase() + '"></li>')
                        .append('<a title="' + item.label + '"> \
                                <div class="arrow"><i/></div> \
                                <div class="image"> \
                                    <img src="' + item.imageurl + '" />  \
                                </div> \
                                <div class="label">' + item.label + '</div> \
                                <div class="line2">' + item.line2 + '</div> \
                                </a>')
                        .appendTo(ul);
                };

                    
                tab.input.val(tab.o.InitialValue);
                tab.input.focus(function () {
                    var term = tab.input.val();
                    term = term == tab.o.InitialValue ? "" : term;
                    
                    tab.input.val(term);
                    tab.input.autocomplete("search", term);
                });
                    
                tab.input.blur(function () {
                    var term = tab.input.val() == "" ? tab.o.InitialValue : tab.input.val();
                    tab.input.val(term);
                });

                tab.setFocus = function () {
                    var term = tab.getTerm();
                    console.debug("content[%s].setFocus :: '%s'", name, term);
                    tab.input.val(term).focus();
                };

                tab.getTerm = function () {
                    var term = tab.input.val();
                    term = (term || "");
                    term = (term == tab.o.InitialValue ? "" : term);
                    return term;
                };

                tab.getSearchCenterUrl = function() {
                    var term = tab.getTerm();
                    term = ns.addWildCard(term);

                    var option = tab.select.find("option:selected");
                    var alternateResultsPage = option.data("alternateResultsPage") || "";
                    var result = alternateResultsPage.length > 0 ? alternateResultsPage : tab.o.ResultsUrl;
                    if (term != "") {
                        result += "?k=" + term;
                    }

                    console.log("content.getSearchCenterUrl : %s", result);
                    return result;
                };

                $.subscribe("QuickSearch:UpdateTerm", function (term) {
                    tab.input.val(term);
                });
            });

            ns.ready = true;
            $.publish("QuickSearch:Content:Ready");
        },
            
        // add wildcard character to search for "StartsWith".
        addWildCard: function (term) {
            term = term.length > 0 && term.substring(term.length - 1) != "*" ? term + "*" : term;
            return term;
        },

        normalize: function (item) {

            item.value = item.Url;
            item.label = item.label != null ? item.label : (item.Title || "?");
            item.imageurl = (item.Image || "/_layouts/images/html16.png");
            item.type = item.Type || "content";

            var prettyUrl = (item.Url || "").replace("https://", "").replace("http://", "");
            item.line2 = item.Description || prettyUrl;

            //console.log("content.normalize :: %o", item);
            return item;
        }
    });

    $(function () {
        ns.initialise();
    });

})(jQuery);
/* -------- ~assets/QuickSearch/people.js -------- */
;
/* jslint devel: true, browser: true, eqeq: true, es5: true, vars: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
;(function($) {

    var core = $.registerNamespace("GridSoft.GridWorks.Core");
    var quicksearch = $.registerNamespace("GridSoft.GridWorks.QuickSearch");
    var ns = $.registerNamespace("GridSoft.GridWorks.QuickSearch.People");

    $.extend(ns, {

        initialise: function() {
            ns.container = $("#gs-quicksearch");
            if (ns.container.length < 1) {
                return;
            }

            console.log("quicksearch.people :: initialise...");

            // setup configuration object, which is a combination of
            // - configuration of quicksearch module
            // - configuration of content tab
            // - overrides passed along in this call.
            ns.o = quicksearch.getConfig("people", this);
            ns.o.ServiceUrl = window._spPageContextInfo.webAbsoluteUrl + ns.o.ServiceUrl;

            ns.panel = $.findOne("#gs-quicksearch-people");
            ns.input = ns.panel.findOne("input");
            ns.loading = ns.panel.findOne(".loading");
            ns.results = ns.panel.findOne(".results");

            ns.input.keydown(function(event) {
                var keyCode = $.ui.keyCode;
                switch (event.keyCode) {
                    case keyCode.ENTER:
                        quicksearch.redirectToSearchCenter();
                        return false;
                }
                return true;
            });

            ns.setupAutocomplete();

            ns.input.val(ns.o.InitialValue);
            ns.input.focus(function() {
                var term = ns.input.val();
                term = term == ns.o.InitialValue ? "" : term;

                ns.input.val(term);
                ns.input.autocomplete("search", term);
            });
            ns.input.blur(function() {
                var term = ns.input.val() == "" ? ns.o.InitialValue : ns.input.val();
                ns.input.val(term);
            });

            $.subscribe("QuickSearch:UpdateTerm", function (term) {
                ns.input.val(term);
            });

            ns.ready = true;
            $.publish("QuickSearch:People:Ready");
        },

        beginRequest: function() {
            ns.loading.show();
            ns.results.hide();
        },

        endRequest: function() {
            ns.loading.hide();
            ns.results.show();
        },

        setFocus: function () {
            var term = ns.getTerm();
            console.debug("people.setFocus :: '%s'", term);
            ns.input.val(term).focus();
        },

        getTerm: function () {
            var term = ns.input.val();
            term = (term || "");
            term = (term == ns.o.InitialValue ? "" : term);
            return term;
        },

        // add wildcard character to search for "StartsWith".
        addWildCard: function(term) {
            term = term.length > 0 && term.substring(term.length - 1) != "*" ? term + "*" : term;
            return term;
        },

        getSearchCenterUrl: function() {
            var term = ns.getTerm();
            term = ns.addWildCard(term);

            var result = ns.o.ResultsUrl;
            if (term != "") {
                result += "?k=" + term;
            }

            console.log("people.getSearchCenterUrl :: %s", result);
            return result;
        },

        setupAutocomplete: function() {
            ns.input.autocomplete({
                minLength: ns.o.MinLength,
                appendTo: ns.results,
                select: function(event, ui) {
                    location.href = ui.item.value;
                    return false;
                },
                source: function(request, response) {
                    var term = ns.getTerm();
                    if (term.length > 0) {
                        $.publish("QuickSearch:UpdateTerm", [term]);
                        
                        var data = {
                            term: ns.addWildCard(term)
                        };

                        ns.beginRequest();
                        $.ajax({
                            cache: false,
                            url: ns.o.ServiceUrl,
                            type: "GET",
                            dataType: "json",
                            data: data,
                            success: function(result) {
                                response(result);
                            },
                            error: function(xhr, status, errorThrown) {
                                console.error("people :: service failure: status: ", status, ", errorThrown: ", errorThrown, ", responseText: ", xhr.responseText.substring(0, 200));
                                ns.endRequest();
                            }
                        });
                    }

                    return;
                },
                close: function() {
                    ns.results.hide();
                }
            });

            var autocomplete = ns.input.data("uiAutocomplete");

            autocomplete.__response = function(content) {

                content = this._normalize(content);
                this._suggest(content);
                this._trigger("open");
                this.pending--;

                if (!this.pending) {
                    this.element.removeClass("ui-autocomplete-loading");
                }
            };

            autocomplete._resizeMenu = function() {
            };

            autocomplete._suggest = function(results) {
                var ul = this.menu.element.empty();

                // consolidate results
                var items = [], rowCount = 0, totalRows = 0;
                var meta = {
                    "type": "total",
                    "line2": ns.o.MoreResultsDescription,
                    "value": ns.getSearchCenterUrl()
                };

                $.each(results, function(key, value) {
                    rowCount += value.RowCount;
                    totalRows += value.TotalRows;
                    $.each(value.Result, function() {
                        items.push(ns.normalize(this));
                    });
                });
                meta.label = ns.o.MoreResultsLabel.replace("{rowCount}", rowCount).replace("{totalRows}", totalRows);
                items.push(meta);

                this._renderMenu(ul, items);
                this.menu.refresh();

                ns.endRequest();
                ul.show();

                if (this.options.autoFocus) {
                    this.menu.next(new $.Event("mouseover"));
                }
            };

            autocomplete._renderItem = function(ul, item) {
                return $('<li class="ui-menu-item-' + item.type + '"></li>')
                    .append('<a title="' + item.label + '"> \
                                    <div class="arrow"><i/></div> \
                                    <div class="image"> \
                                        <img src="' + item.imageurl + '" /> \
                                    </div> \
                                    <div class="label">' + item.label + '</div> \
                                    <div class="line2">' + item.line2 + '</div> \
                                    <div class="line3">' + item.line3 + '</div> \
                                </a>')
                    .appendTo(ul);
            };
        },

        normalize: function(item) {
            item.label = item.Title || "";
            item.type = item.Type || "";
            item.value = item.Path || "";
            item.imageurl = item.PictureURL || "/_layouts/images/o14_person_placeholder_32.png";
            item.line2 = item.OrganisationUnit || "";
            item.line3 = item.WorkPhone || "";

            //console.log("people.normalize :: %o", item);
            return item;
        }
    });

    $(function() {
        ns.initialise();
    });

})(jQuery);

/* -------- ~assets/QuickSearch/quicklinks.js -------- */
;
/* jslint devel: true, browser: true, eqeq: true, es5: true, vars: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
(function($) {
    
    var core = $.registerNamespace("GridSoft.GridWorks.Core");
    var quicksearch = $.registerNamespace("GridSoft.GridWorks.QuickSearch");
    var ns = $.registerNamespace("GridSoft.GridWorks.QuickSearch.QuickLinks");
    
    $.extend(ns, {

        imagesPath: "/Style Library/GridSoft/GridWorks/QuickSearch/images/{0}.png",

        initialise: function() {
            ns.container = $("#gs-quicksearch");
            if (ns.container.length < 1) {
                return;
            }
                
            console.log("quicksearch.quicklinks :: initialise...");

            // setup configuration object, which is a combination of
            // - configuration of quicksearch module
            // - configuration of content tab
            // - overrides passed along in this call.
            ns.o = quicksearch.getConfig("quicklinks", this);

            // uncomment the following line to call service in the current site collection.
            // per default, the quick links of the root site collection are loaded.
            // ns.o.ServiceUrl = window._spPageContextInfo.webAbsoluteUrl + tab.o.ServiceUrl;
                
            ns.panel = $.findOne("#gs-quicksearch-quicklinks");
            ns.input = ns.panel.findOne("input");
            ns.loading = ns.panel.findOne(".loading");
            ns.results = ns.panel.findOne(".results");

            $.ajax({
                cache: false,
                url: ns.o.ServiceUrl,
                type: "GET",
                dataType: "json",
                success: function(result) {
                    ns.onSourceLoaded(result);
                },
                error: function(xhr, status, errorThrown) {
                    console.error("service failure: status: ", status, ", errorThrown: ", errorThrown, ", responseText: ", xhr.responseText.substring(0, 200));
                    ns.loading.hide();
                }
            });
        },

        setFocus: function () {
            var term = ns.getTerm();
            console.debug("quickSearch.setFocus :: '%s' (term from other tabs is ignored).", term);
            ns.input.focus();
        },

        getTerm: function () {
            var term = ns.input.val();
            term = (term || "");
            term = (term == ns.o.InitialValue ? "" : term);
            return term;
        },
            
        onSourceLoaded: function(source) {
            var items = [];
            $.each(source, function() {
                items.push(ns.normalize(this));
            });

            ns.input.autocomplete({
                minLength: ns.o.MinLength,
                source: items,
                appendTo: ns.results,
                select: function(event, ui) {
                    var url = ui.item.Url || "";
                    var target = ui.item.Target || "";
                    console.log(ns.name, "selected, url: ", url, ", target: ", target);

                    if (url.length > 0) {
                        if (target != "newWindow") {
                            window.location.href = url;
                        } else {
                            window.open(url);
                        }
                    }
                    return false;
                },
                close: function() {
                    // allow the autocomplete widget to hide the list.
                }
            });

            ns.input.focus(function() {
                var term = ns.input.val();
                term = term == ns.o.InitialValue ? "" : term;
                ns.input.val(term);
                ns.input.autocomplete("search", term);
            });
                
            ns.input.blur(function() {
                var term = ns.input.val() == "" ? ns.o.InitialValue : ns.input.val();
                ns.input.val(term);
            });

            var autocomplete = ns.input.data("uiAutocomplete");
                
            autocomplete._suggest = function(results) {
                var ul = this.menu.element.empty();

                this._renderMenu(ul, results);
                this.menu.refresh();

                // size and position menu
                ns.results.show();
                ul.show();

                if (this.options.autoFocus) {
                    this.menu.next(new $.Event("mouseover"));
                }
            };
                
            autocomplete._renderItem = function(ul, item) {
                return $('<li class="ui-menu-item-' + item.Type + '"></li>')
                    .append('<a title="' + item.label + '"> \
                                <div class="arrow"><i/></div> \
                                <div class="image">' + item.CategoryImage + '\
                                </div> \
                                <div class="label">' + item.label + ' ' + item.TargetIcon + '</div> \
                            </a>')
                    .appendTo(ul);
            };

            ns.input.keydown(function(event) {
                var keyCode = $.ui.keyCode;
                switch (event.keyCode) {
                    case keyCode.ENTER:
                        ; // location.href = o.redirecturl + escape(o.input.val());
                        return false;
                }
                return true;
            });
                
            ns.input.val(ns.InitialValue);
                
            ns.input.focus(function() {
                ns.input.val(ns.input.val() == ns.InitialValue ? "" : ns.input.val());
                ns.input.autocomplete("search", ns.input.val());
            });
                
            ns.input.blur(function() {
                ns.input.animate({ opacity: 1 }, 50, function() {
                    ns.input.val(ns.input.val() == "" ? ns.InitialValueValue : ns.input.val());
                });
            });
                
            ns.input.keydown(function(event) {
                var keyCode = $.ui.keyCode;
                switch (event.keyCode) {
                    case keyCode.ESCAPE:
                        setTimeout(function() {
                            ns.input.val("");
                            ns.input.focus();
                        }, 10);
                        return false;

                    case keyCode.ENTER:
                        event.preventDefault();
                        return false;
                }
                return true;
            });

            ns.loading.hide();

            $.subscribe("QuickSearch:UpdateTerm", function (term) {
                // do not set term automatically.
                // ns.input.val(term);
            });

            ns.ready = true;
            $.publish("QuickSearch:QuickLinks:Ready");
        },

        normalize: function(item) {
            var prettyUrl = (item.Url || "").replace("https://", "").replace("http://", "");

            item.label = item.Title || prettyUrl;
            item.value = item.Url + "|" + item.label;
            item.Type = "quicklink";
            
            // generate icon images.
            var imageTemplate = '<img src="{0}" />';
            item.TargetIcon = item.NewWindow ? imageTemplate.format(ns.imagesPath.format("newwindow")) : "";
            item.CategoryImage = imageTemplate.format(ns.imagesPath.format((item.Category || "internal").toLowerCase()));

            // console.debug(ns.name, "normalize", item);
            return item;
        }
    });

    $(function () {
        ns.initialise();
    });

})(jQuery);