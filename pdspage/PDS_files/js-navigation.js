
/* -------- ~assets/Core/lib/jquery-hoverIntent.js -------- */
;
/**
* hoverIntent is similar to jQuery's built-in "hover" function except that
* instead of firing the onMouseOver event immediately, hoverIntent checks
* to see if the user's mouse has slowed down (beneath the sensitivity
* threshold) before firing the onMouseOver event.
* 
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
* 
* hoverIntent is currently available for use in all personal or commercial 
* projects under both MIT and GPL licenses. This means that you can choose 
* the license that best suits your project, and use it accordingly.
* 
* // basic usage (just like .hover) receives onMouseOver and onMouseOut functions
* $("ul li").hoverIntent( showNav , hideNav );
* 
* // advanced usage receives configuration object only
* $("ul li").hoverIntent({
*	sensitivity: 7, // number = sensitivity threshold (must be 1 or higher)
*	interval: 100,   // number = milliseconds of polling interval
*	over: showNav,  // function = onMouseOver callback (required)
*	timeout: 0,   // number = milliseconds delay before onMouseOut function call
*	out: hideNav    // function = onMouseOut callback (required)
* });
* 
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @Author Brian Cherne brian(at)cherne(dot)net
*/
(function($) {
	$.fn.hoverIntent = function(f,g) {
		// default configuration options
		var cfg = {
			sensitivity: 7,
			interval: 100,
			timeout: 0
		};
		// override configuration options with user supplied object
		cfg = $.extend(cfg, g ? { over: f, out: g } : f );

		// instantiate variables
		// cX, cY = current X and Y position of mouse, updated by mousemove event
		// pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
		var cX, cY, pX, pY;

		// A private function for getting mouse position
		var track = function(ev) {
			cX = ev.pageX;
			cY = ev.pageY;
		};

		// A private function for comparing current and previous mouse position
		var compare = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			// compare mouse positions to see if they've crossed the threshold
			if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
				$(ob).unbind("mousemove",track);
				// set hoverIntent state to true (so mouseOut can be called)
				ob.hoverIntent_s = 1;
				return cfg.over.apply(ob,[ev]);
			} else {
				// set previous coordinates for next time
				pX = cX; pY = cY;
				// use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
				ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
			}
		};

		// A private function for delaying the mouseOut function
		var delay = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			ob.hoverIntent_s = 0;
			return cfg.out.apply(ob,[ev]);
		};

		// A private function for handling mouse 'hovering'
		var handleHover = function(e) {
			// copy objects to be passed into t (required for event object to be passed in IE)
			var ev = jQuery.extend({},e);
			var ob = this;

			// cancel hoverIntent timer if it exists
			if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }

			// if e.type == "mouseenter"
			if (e.type == "mouseenter") {
				// set "previous" X and Y position based on initial entry point
				pX = ev.pageX; pY = ev.pageY;
				// update "current" X and Y position based on mousemove
				$(ob).bind("mousemove",track);
				// start polling interval (self-calling timeout) to compare mouse coordinates over time
				if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}

			// else e.type == "mouseleave"
			} else {
				// unbind expensive mousemove event
				$(ob).unbind("mousemove",track);
				// if hoverIntent state is true, then call the mouseOut function after the specified delay
				if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
			}
		};

		// bind the function to the two event listeners
		return this.bind('mouseenter',handleHover).bind('mouseleave',handleHover);
	};
})(jQuery);
/* -------- ~StyleLibrary/GridSoft/Psych/Flyout/module.js -------- */
;
/// <reference path="../../../../../../../gridworks-core/GridSoft.GridWorks.Core/Modules/StyleLibrary/GridSoft/GridWorks/jquery-1.10.2.js"/>
/// <reference path="../../../../../../../gridworks-core/GridSoft.GridWorks.Core/Modules/StyleLibrary/GridSoft/GridWorks/Core/lib/jquery-extensions.js"/>
/// <reference path="../../../../../../../gridworks-core/GridSoft.GridWorks.Core/Modules/StyleLibrary/GridSoft/GridWorks/core.js"/>
// ReSharper disable Html.CssClassNotUsed
// ReSharper disable Html.CssClassElementsNotFound
// ReSharper disable CoercedEqualsUsing

; (function ($) {

    var ns = $.registerNamespace("GridSoft.GridWorks.Navigation.Flyout", {

        input: null,
        filterInitial: "Suchen...",
        overviewUrl: "/_vti_bin/GridSoft/GridWorks/Navigation/NavigationService.svc/GetOverview",
        navigatorUrl: "/_vti_bin/GridSoft/GridWorks/Navigation/NavigationService.svc/GetNavigator",
        updateQuickstartUrl: "/_vti_bin/GridSoft/GridWorks/Navigation/NavigationService.svc/UpdateQuickstartUrl",

        onDomReady: function () {
            ns.container = $("#DeltaTopNavigation");
            if (ns.container.length != 1) {
                return;
            }

            ns.appendShimTo = $("#contentRow");

            var overview = ns.container.find(".gs-overview-trigger");
            if (overview.length > 0) {
                overview.click(function (e) {
                    e.preventDefault();

                    var target = $(e.target).closest("a");
                    ns.showNavigation(target);
                });
                ns.log("registered %o overview flyout on %s", overview.length, overview.selector);
            }


            var details = ns.container.find(".gs-details-trigger");
            if (details.length > 0) {
                details.click(function (e) {
                    e.preventDefault();

                    var target = $(e.target).closest("a");
                    ns.showNavigation(target);
                });
                ns.log("registered %o details flyout on %s", details.length, details.selector);
            }

            ns.columnDefinition = {};
            $.ajax({
                url: "/Style%20Library/GridSoft/Psych/Flyout/breaks.xml",
                type: "GET",
                dataType: "xml",
                headers: {
                    "WSS_KeepSessionAuthenticated": $.cookie("WSS_KeepSessionAuthenticated")
                },
                success: function(xmlDocument) {
                    console.log("loaded breaks definition: %s", xmlDocument);
                    ns.columnDefinition = $(xmlDocument) || {};
                },
                error: function() {
                    ns.columnDefinition = {};
                }
            });
            
            $.publish("Flyout:Ready");
        },

        showNavigation: function (target) {
            $.publish("Flyout:ShowNavigation", [target]);

            ns.closeNavigation();

            var navigation = $('<div class="gs-flyout ui-widget ui-widget-content">\
                                <div class="gs-flyout-header">\
                                    <div class="gs-flyout-title"><span>&nbsp;</span></div>\
                                    <input class="gs-flyout-search" />\
                                    <a class="gs-flyout-quickaccess">\
                                        <span class="normal">Schnellzugriff festlegen</span>\
                                        <span class="error">Schnellzugriff konnte nicht festgelegt werden</span>\
                                        <span class="success">Schnellzugriff wurde festgelegt</span>\
                                    </a>\
                                    <a class="gs-flyout-close" href="#"><span>x</span>schliessen</a>\
                                </div>\
                                <div class="gs-flyout-content">\
                                    <div class="gs-flyout-inner">\
                                        <div class="gs-flyout-overview">\
                                            <span class="gs-loading">Lade Navigation...</span>\
                                            <span class="gs-content"></span>\
                                        </div>\
                                        <div class="gs-flyout-details">\
                                            <span class="gs-loading">Lade Details...</span>\
                                            <span class="gs-content"></span>\
                                        </div>\
                                    </div>\
                                </div>\
                            </div>');

            navigation.appendTo(ns.container);

            // this needs to be relative to be able to position the shim via css
            ns.appendShimTo = $("#contentRow");
            ns.appendShimTo.css({ position: "relative" });
            ns.shim = $('<div class="gs-flyout-shim"></div>');
            ns.shim.appendTo(ns.appendShimTo);

            ns.element = $(".gs-flyout");
            ns.innerContainer = ns.element.find(".gs-flyout-inner");

            ns.overviewContainer = ns.element.find(".gs-flyout-overview");
            ns.overviewLoading = ns.overviewContainer.find(".gs-loading");
            ns.overviewContent = ns.overviewContainer.find(".gs-content");

            ns.detailsContainer = ns.element.find(".gs-flyout-details");
            ns.detailsLoading = ns.detailsContainer.find(".gs-loading");
            ns.detailsContent = ns.detailsContainer.find(".gs-content");

            ns.element.find(".gs-flyout-active").removeClass("gs-flyout-active");

            var close = ns.element.find(".gs-flyout-close");
            close.click(function () {
                ns.closeNavigation();
            });

            // close on shim click
            ns.shim.click(function () {
                ns.closeNavigation();
            });

            ns.quickaccess = ns.element.find(".gs-flyout-quickaccess");
            ns.quickaccess.click(function (e) {
                e.preventDefault();
                ns.updateQuickAccessNode();
            });

            var borderWidth = parseInt($("#DeltaTopNavigation li > a").css("border-right-width"));
            var flyoutBorderWith = parseInt($("#DeltaTopNavigation > div.gs-flyout").css("border-right-width"));
            var title = ns.element.find(".gs-flyout-title");
            var left = target.position().left - ns.element.position().left - borderWidth + 1 - flyoutBorderWith;
            var width = target.outerWidth() - borderWidth - 2;
            if (left < 0) {
                left = borderWidth * -1;
                width += Math.ceil(borderWidth / 2);
            }
            title.css({
                width: width,
                left: left
            });
            title.children("span").css("margin-top", target.outerHeight() + "px");

            target.addClass("gs-flyout-active");
            target.parent().addClass("gs-flyout-active");

            ns.filterInput = ns.element.find(".gs-flyout-search");
            ns.filterInput.val(ns.filterInitial);
            ns.filterInput.focus(function () {
                ns.filterInput.val(ns.filterInput.val() == ns.filterInitial ? "" : ns.filterInput.val());
            });
            ns.filterInput.blur(function () {
                ns.filterInput.animate({ opacity: 1 }, 50, function () {
                    ns.filterInput.val(ns.filterInput.val() == "" ? ns.filterInitial : ns.filterInput.val());
                });
            });
            ns.filterInput.keyup(ns.filter);
            ns.filterInput.keydown(function (event) {
                var keyCode = $.ui.keyCode;

                switch (event.keyCode) {

                    case keyCode.ESCAPE:
                        ns.filterInput.val("");
                        ns.filter();
                        return false;

                    case keyCode.ENTER:
                        event.preventDefault();
                        return false;
                }
                return true;
            });
            ns.filterInput.change(ns.filter);

            // load the content
            var url = target.attr("href");

            if (target.hasClass("gs-details-trigger")) {
                var abbreviation = target.text();
                ns.showDetailContent(url, abbreviation, true);
            } else {
                ns.showOverviewContent(url);
            }

            ns.filterInput.focus();
        },

        renderOverviewItems: function (url, items) {
            var context = ns.getContext(url, items);
            context.renderNavigator = true;

            ns.renderChildren(context, 0, items);
            return context.html.join("");
        },

        countItems: function (items) {
            if (items) {
                var count = 0;
                $.each(items, function (i, item) {
                    count += 1 + ns.countItems(item.children);
                });
                return count;
            }
            return 0;
        },

        getColumnCss: function (context, item) {
            var column = context.column,
                columnWithOffset = context.column + (context.columnOffset || 0),
                tot = context.totalColumns,
                displayTitleColumn = context.displayTitleColumn || false,
                isTitleColumn = item.isTitleColumn || false;

            var classes = ["gs-column", "gs-column-" + columnWithOffset];
            if (displayTitleColumn) {
                classes.push("gs-column-withtitle");
            }
            if (columnWithOffset == 0) {
                classes.push("gs-column-first");
            }
            if (column == tot - 1) {
                classes.push("gs-column-last");
            }
            if (columnWithOffset > 0 && isTitleColumn) {
                classes.push("gs-column-border");
            }
            classes = classes.join(" ");

            ns.log("getColumnCss : column=", column, ", totalColumns=", tot, ", isTitleColumn=", isTitleColumn, ", displayTitleColumn=", displayTitleColumn, " => ", classes);
            return classes;
        },

        renderChildren: function (context, level, items) {
            if ($.isArray(items) && items.length > 0) {

                $.each(items, function (i, item) {
                    var displayName = (item.title || "").replace("_", " ");
                    var tooltip = (item.tooltip || displayName).replace("_", " ");
                    var url = (item.url || "");
                    var abbreviation = (item.abbreviation || (url.split("/").pop() || "").toUpperCase());

                    var isFirstItemInColumn = false;
                    var isTitleColumn = item.isTitleColumn || false;
                    var displayTitleColumn = context.displayTitleColumn || false;
                    var previousIsTitleColumn = (context.previousItem != null && (context.previousItem.isTitleColumn || false));
                    var hasUrl = url.length > 0;

                    if (isTitleColumn) {
                        if (context.rendered > 0) {
                            context.html.push('</div>');
                            context.column++;
                        }
                        context.html.push('<div class="');
                        context.html.push(ns.getColumnCss(context, item));
                        context.html.push('">');

                        isFirstItemInColumn = true;

                    } else if (context.rendered == 0) {
                        context.html.push('<div class="');
                        context.html.push(ns.getColumnCss(context, item));
                        context.html.push('">');

                        isFirstItemInColumn = true;

                    } else if (context.rendered % context.itemsPerColumn == 0) {
                        context.column++;

                        context.html.push('</div>');
                        context.html.push('<div class="');
                        context.html.push(ns.getColumnCss(context, item));
                        context.html.push('">');

                        isFirstItemInColumn = true;
                    } else if (context.isBreak(item)) {
                        context.column++;

                        context.html.push('</div>');
                        context.html.push('<div class="' + ns.getColumnCss(context, item) + '">');

                        isFirstItemInColumn = true;
                    }

                    var debug = false;
                    if (debug) {
                        ns.log({
                            "displayName": displayName,
                            "tooltip": tooltip,
                            "isFirstItemInColumn": isFirstItemInColumn,
                            "isTitleColumn": isTitleColumn,
                            "hasUrl": hasUrl,
                            "previousIsTitleColumn": previousIsTitleColumn
                        });
                    }

                    if (!isTitleColumn || displayTitleColumn) {
                        var classes = ["gs-item", "gs-level-" + level];
                        if (isTitleColumn) {
                            classes.push("gs-column-title");
                        }
                        if ((isFirstItemInColumn && !isTitleColumn) || previousIsTitleColumn) {
                            classes.push("gs-first");
                        }
                        classes = classes.join(" ");
                        context.html.push('<div class="');
                        context.html.push(classes);
                        context.html.push('">');

                        if (hasUrl) {
                            context.html.push('<a class="gs-item-link" href="');
                            context.html.push(item.url);
                            context.html.push('" title="');
                        } else {
                            context.html.push('<div class="gs-item-link" title="');
                        }
                        context.html.push(tooltip);
                        context.html.push('" data-abbreviation="');
                        context.html.push(abbreviation);
                        context.html.push('">');
                        
                        if (context.renderNavigator === true && item.Navigator != false) {
                            context.html.push('<span class="navigator"></span>');
                        }

                        context.html.push('<span class="title">');
                        context.html.push(displayName);
                        context.html.push('</span>');

                        if (isTitleColumn) {
                            context.html.push('<span class="description">Zur ');
                            context.html.push(displayName);
                            context.html.push(' Startseite</span>');
                        }

                        if (hasUrl) {
                            context.html.push('</a>');
                        } else {
                            context.html.push('</div>');
                        }
                        context.html.push('</div>');
                    }

                    context.rendered++;
                    context.previousItem = item;

                    ns.renderChildren(context, level + 1, item.children);

                    if (context.rendered == context.totalItems) {
                        context.html.push('</div>');
                    }
                });
            }
        },

        closeNavigation: function () {
            $.publish("Flyout:CloseNavigation");

            if (ns.shim) {
                ns.shim.remove();
            }
            if (ns.element) {
                ns.element.remove();
            }
            if (ns.container) {
                ns.container.find(".gs-flyout-active").removeClass("gs-flyout-active");
            }
        },

        updateQuickAccessNode: function () {
            var url = ns.quickaccess.data("url");
            var abbreviation = ns.quickaccess.data("abbreviation");
            ns.log("updateQuickAccessNode url=%s, title=%s", url, abbreviation);

            // get the context url. 
            var siteUrl = "/";
            try {
                siteUrl = window.SP.ClientContext.get_current().get_url();
            } catch (e) { }
            siteUrl = siteUrl == "/" ? "" : siteUrl;

            var updateQuickstartUrl = siteUrl + ns.updateQuickstartUrl;
            $.ajax({
                type: "POST",
                url: updateQuickstartUrl,
                data: JSON.stringify({
                    url: url,
                    title: abbreviation
                }),
                processdata: true,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var success = result && result.UpdateQuickstartUrlResult;
                    var element = ns.quickaccess.find("span." + (success ? "success" : "error"));
                    var normal = ns.quickaccess.find("span.normal").fadeOut(function() {
                        element.fadeIn();
                    });
                    setTimeout(function() {
                        element.fadeOut(function() {
                            normal.fadeIn();
                        });
                    }, 2000);
                },
                error: function (xhr, status, errorThrown) {
                    ns.error("service failure: status: ", status, ", errorThrown: ", errorThrown, ", responseText: ", xhr.responseText.substring(0, 200));
                }
            });
        },


        showOverviewContent: function (url) {
            ns.overviewLoading.show();
            ns.overviewContent.hide();

            var startTime = new Date().getTime();
            var data = {
                url: url
            };

            // get the context url. 
            var siteUrl = "/";
            try {
                siteUrl = window.SP.ClientContext.get_current().get_url();
            } catch (e) { }
            siteUrl = siteUrl == "/" ? "" : siteUrl;

            $.ajax({
                url: siteUrl + ns.overviewUrl,
                type: "GET",
                dataType: "json",
                data: data,
                cache: false,
                success: function (result) {
                    var content = ns.renderOverviewItems(url, result);

                    // show the spinner for at least 500ms.
                    var timeSpent = new Date().getTime() - startTime;
                    var minSpinner = 500;

                    if (timeSpent >= minSpinner) {
                        ns.setOverviewContent(url, content);
                    } else {
                        ns.overviewContainer.animate({ opacity: 1 }, minSpinner - timeSpent, function () {
                            ns.setOverviewContent(url, content);
                        });
                    }
                },
                error: function (xhr, status, errorThrown) {
                    ns.error("service failure: status: ", status, ", errorThrown: ", errorThrown, ", responseText: ", xhr.responseText.substring(0, 200));
                    ns.setOverviewContent(url, errorThrown);
                }
            });
        },

        setOverviewContent: function (url, content) {

            // remove existing event handlers.
            if (ns.visibleLinks != null) {
                ns.visibleLinks.unbind("click");
            }
            if (ns.visibleNavigators != null) {
                ns.visibleNavigators.unbind("hover");
            }

            ns.overviewLoading.hide();
            ns.overviewContent.html(content).show();

            ns.visibleContainer = ns.overviewContainer;
            ns.visibleItems = ns.visibleContainer.find(".gs-item");

            ns.visibleLinks = ns.overviewContainer.find("a");
            ns.visibleLinks.bind("click", function (e) {
                var target = $(e.target);
                if (target.hasClass("navigator")) {
                    e.preventDefault();

                    var link = target.parent("a");
                    var href = link.attr("href");
                    var abbreviation = link.data("abbreviation");
                    if (href.length > 0) {
                        ns.showDetailContent(href, abbreviation, false);
                    }
                }
            });

            ns.visibleNavigators = ns.overviewContainer.find("span.navigator");
            var navigators = ns.visibleNavigators.length;
            ns.log("has navigators?", navigators);
            if (navigators > 0) {
                ns.overviewContainer.addClass("gs-flyout-hasnavigators");
            } else {
                ns.overviewContainer.removeClass("gs-flyout-hasnavigators");
            }

            ns.visibleNavigators.hover(
                function () {
                    $(this).addClass("active");
                },
                function () {
                    $(this).removeClass("active");
                }
            );

            $.publish("Flyout:SetOverviewContent", [url, content]);
        },

        showDetailContent: function (url, abbreviation, navigatorInvokedDirectly) {
            ns.log("showDetailContent url=%s, title=%s, invoked directly=%o", url, abbreviation, navigatorInvokedDirectly);
            $.publish("Flyout:ShowDetailContent", [url, abbreviation, navigatorInvokedDirectly]);

            ns.quickaccess.data("url", url);
            ns.quickaccess.data("abbreviation", abbreviation);

            if (navigatorInvokedDirectly !== true) {
                ns.slideRight();
            } else {
                ns.slideRight(0);
            }

            var startTime = new Date().getTime();
            var data = {
                url: url
            };

            $.ajax({
                url: ns.navigatorUrl,
                type: "GET",
                dataType: "json",
                cache: false,
                data: data,
                success: function (result) {
                    var content = ns.renderDetailItems(result, navigatorInvokedDirectly);
                    
                    // show the spinner for at least 500ms.
                    var timeSpent = new Date().getTime() - startTime;
                    var minSpinner = 500;
                    if (timeSpent >= minSpinner) {
                        ns.setDetailContent(content);
                    } else {
                        ns.detailsContainer.animate({ opacity: 1 }, minSpinner - timeSpent, function () {
                            ns.setDetailContent(content);
                        });
                    }
                },
                error: function (xhr, status, errorThrown) {
                    ns.error("service failure: status: ", status, ", errorThrown: ", errorThrown, ", responseText: ", xhr.responseText.substring(0, 200));
                    ns.setDetailContent(errorThrown);
                }
            });
        },

        renderDetailItems: function (items, navigatorInvokedDirectly) {
            var context = ns.getContext(null, items);

            if (navigatorInvokedDirectly !== true) {
                context.html.push('<div class="gs-backlink">');
                context.html.push('  <a href="#">Zur&uuml;ck zur &Uuml;bersicht</a>');
                context.html.push('</div>');
            }

            var publics = null, internals = null;

            if ($.isArray(items) && items.length > 0) {

                if (items.length == 1) {
                    publics = {
                        html: [],
                        column: 0,
                        displayTitleColumn: false,
                        items: [$.extend(items[0], { isTitleColumn: true })],
                        totalItems: ns.countItems(items[0].children) + 1,
                        rendered: 0
                    };

                    context.totalItems = publics.totalItems;
                    context.ratio = 1;

                    publics = ns.setColumns(publics, 0, 4);
                }

                if (items.length > 1) {
                    publics = {
                        html: [],
                        column: 0,
                        displayTitleColumn: true,
                        items: [$.extend(items[0], { isTitleColumn: true })],
                        totalItems: ns.countItems(items[0].children) + 1,
                        rendered: 0
                    };
                    publics = ns.setColumns(publics, 0, 4);

                    internals = {
                        html: [],
                        displayTitleColumn: true,
                        items: [$.extend(items[1], { isTitleColumn: true })],
                        totalItems: ns.countItems(items[1].children) + 1,
                        rendered: 0
                    };

                    context.totalItems = internals.totalItems + publics.totalItems;
                    context.ratio = publics.totalItems / context.totalItems;

                    if (context.ratio < 0.25) {
                        // publics: 1/4     internals: 3/4
                        publics = ns.setColumns(publics, 0, 1);
                        internals = ns.setColumns(internals, 1, 3);

                    } else if (0.25 < context.ratio && context.ratio < 0.75) {
                        // publics: 2/4     internals: 2/4
                        publics = ns.setColumns(publics, 0, 2);
                        internals = ns.setColumns(internals, 2, 2);

                    } else {
                        // publics: 3/4     internals: 1/4
                        publics = ns.setColumns(publics, 0, 3);
                        internals = ns.setColumns(internals, 3, 1);
                    }
                }

                ns.log("renderItems=", context.totalItems, ", ratio=", context.ratio.toFixed(2), ", publics=", publics, ", internals=", internals);

                if (publics != null) {
                    ns.renderChildren(publics, 0, publics.items);
                    context.html.push(publics.html.join(""));
                }

                if (internals != null) {
                    ns.renderChildren(internals, 0, internals.items);
                    context.html.push(internals.html.join(""));
                }

            } else {
                context.html.push('<div class="gs-empty">Keine Elemente gefunden.</div>');
            }

            return context.html.join("");
        },

        setColumns: function (context, offset, maxColumns) {
            if (context.totalItems <= 25) {
                context.totalColumns = Math.min(maxColumns, 1);
            } else if (context.totalItems <= 50) {
                context.totalColumns = Math.min(maxColumns, 2);
            } else {
                context.totalColumns = Math.min(maxColumns, 4);
            }

            context.column = 0;
            context.columnOffset = offset;
            context.itemsPerColumn = Math.ceil(context.totalItems / context.totalColumns);
            return context;
        },

        setDetailContent: function (content) {
            ns.detailsLoading.hide();
            ns.detailsContent.html(content);

            ns.visibleContainer = ns.detailsContainer;
            ns.visibleItems = ns.visibleContainer.find(".gs-item");

            var backlink = $(".gs-backlink");
            backlink.click(function (e) {
                e.preventDefault();
                ns.slideLeft();
            });

            ns.detailsContent.show();
        },

        getContext: function (url, items) {
            var context = {
                url: url,
                html: [],
                totalItems: ns.countItems(items),
                rendered: 0,
                column: 0
            };
            if (context.totalItems <= 20) {
                context.totalColumns = 1;
            } else if (context.totalItems <= 40) {
                context.totalColumns = 2;
            } else {
                context.totalColumns = 4;
            }
            context.itemsPerColumn = Math.ceil(context.totalItems / context.totalColumns);
            
            var breaks = ns.columnDefinition.find("flyout[url='" + url + "'] break");
            context.breaks = breaks.map(function() {
                var breakTitle = $(this).attr("title") || "";
                var breakUrl = $(this).attr("url") || "";
                // url tests for endswith: http://somehost/dep/dir matches /dep/dir, but not /dep/dir/subdep
                var urlMatch = breakUrl != "" ? new RegExp(breakUrl + "$", "i") : null;
                
                return {
                    title: breakTitle,
                    url: breakUrl,
                    urlMatch: urlMatch
                };
            });
            
            if(breaks.length > 0)
            {
                context.totalColumns = breaks.length + 1;
                
                // we'll handle the breaks ourselves.
                context.itemsPerColumn = context.totalItems;
            }
            
            console.log("found %o break definitions for url %s: %o", context.totalColumns, context.url, context.breaks);
            
            context.isBreak = function(item) {
                return this.breaks.filter(function() {
                    if (this.title == (item.title || "").replace("_", " ")) {
                        return true;
                    }
                    if (this.urlMatch != null && this.urlMatch.test(item.url)) {
                        return true;
                    }
                    return false;
                }).length > 0;
            };
            
            return context;
        },

        filter: function () {
            clearTimeout(ns.filterTimeout);

            $.extend($.expr[':'], {
                'containsi': function (elem, i, match) {
                    return (elem.textContent || elem.innerText || '').toLowerCase()
                            .indexOf((match[3] || "").toLowerCase()) >= 0;
                }
            });

            setTimeout(function () {
                var filter = ns.filterInput.val() || "";

                ns.visibleContainer.removeClass("gs-filter-active");
                ns.visibleItems.removeClass("gs-filter");

                var filtered = [];
                if (filter.length > 0) {
                    ns.visibleItems.each(function () {
                        var isMatch = $(this).find(':containsi(' + filter + ')').length == 0;
                        if (isMatch) {
                            filtered.push(this);
                        }
                    });
                }
                if (filtered.length > 0) {
                    ns.visibleContainer.addClass("gs-filter-active");
                    $.each(filtered, function () {
                        $(this).addClass("gs-filter");
                    });
                }

            }, 200);
        },

        slideLeft: function (slideTime) {

            ns.quickaccess.css("visibility", "hidden");
            ns.quickaccess.removeData("url");
            ns.quickaccess.removeData("title");

            slideTime = slideTime == null ? 200 : slideTime;

            ns.detailsContainer.animate({ opacity: 0 }, 500);
            ns.detailsLoading.hide();
            ns.detailsContent.hide();

            ns.overviewContainer.css({ opacity: 0 });
            ns.overviewLoading.hide();
            ns.overviewContent.show();

            ns.innerContainer.animate({ left: 0 }, slideTime, function () {
                ns.overviewContainer.animate({ opacity: 1 }, 50);
            });
        },

        slideRight: function (slideTime) {
            slideTime = slideTime == null ? 200 : slideTime;

            ns.overviewContainer.animate({ opacity: 0 }, 500);
            ns.overviewLoading.hide();
            ns.overviewContent.hide();

            ns.detailsContainer.css({ opacity: 0 });
            ns.detailsContent.hide();

            ns.innerContainer.animate({ left: -1060 }, slideTime, function () {
                ns.detailsLoading.show();
                ns.detailsContainer.animate({ opacity: 1 }, 50);

                if (slideTime != 0) {
                    ns.quickaccess.css("visibility", "visible");
                }
            });
        }
    });

})(jQuery);
/* -------- ~assets/Navigator/module.js -------- */
;
/// <reference path="../../../../../../../gridworks-core/GridSoft.GridWorks.Core/Modules/StyleLibrary/GridSoft/GridWorks/jquery-1.10.2.js"/>
/// <reference path="../../../../../../../gridworks-core/GridSoft.GridWorks.Core/Modules/StyleLibrary/GridSoft/GridWorks/Core/lib/jquery-extensions.js"/>
/// <reference path="../../../../../../../gridworks-core/GridSoft.GridWorks.Core/Modules/StyleLibrary/GridSoft/GridWorks/core.js"/>
// ReSharper disable Html.CssClassNotUsed
// ReSharper disable CoercedEqualsUsing

(function ($) {

    var ns = $.registerNamespace("GridSoft.GridWorks.Navigation.Navigator", {

        mode: "auto",
        containerSelector: "#DeltaPlaceHolderLeftNavBar",
        initialising: false,

        onDomReady: function () {
            ns.containerAvailable($(ns.containerSelector));
        },

        containerAvailable: function (container) {
            // enabled is rendered in NavigatorDelegate.ascx.
            if (!ns.enabled) {
                return;
            }
            if (!container.length) {
                return;
            }
            if (ns.initialising) {
                return;
            }

            ns.initialising = true;
            ns.log("onDomReady");
            ns.container = container;
            ns.container.addClass("gs-navigator-container");
            ns.log("attaching navigator to: ", ns.container);
            
            // adding trigger
            ns.trigger = $("<div/>").text(ns.title).addClass("gs-navigator-trigger");
            ns.container.prepend(ns.trigger);
                
            ns.trigger.hoverIntent(
                function () {
                    ns.show();
                }, 
                function () {
                    if (ns.mode == "auto") {
                        ns.close();
                    }
                },
                200
            );

            // manual mode: first click (navigator stays open)
            // second click: goes back to hoverIntent/auto mode.
            ns.trigger.click(function () {
                var visible = ns.element.is(":visible");
                if (ns.mode == "auto") {
                    ns.mode = "manual";
                    visible = false;
                }
                if (visible) {
                    ns.close();
                    ns.mode = "auto";
                } else {
                    ns.show();
                }
            });
        },

        show: function () {
            ns.log("navigator show (mode:%s, url:%s)", ns.mode, ns.contextUrl);
            
            ns.element = $(".gs-navigator");
            if (ns.element.length == 0) {
                ns.element = $('\
                    <div class="gs-navigator ui-widget ui-widget-content">\
                        <div class="gs-navigator-content">\
                            <span class="gs-loading">Lade Navigator...</span>\
                        </div>\
                    </div>');

                ns.trigger.append(ns.element);
                ns.content = $(".gs-navigator-content");
                ns.load();
            }

            ns.element.show();
        },

        close: function () {
            ns.log("navigator close (mode:%s, url:%s)", ns.mode, ns.contextUrl);
            ns.element.hide();
        },

        renderItems: function (items) {
            var context = {
                html: [],
                totalItems: 0,
                rendered: 0,
                column: 0,
                processed: 0
            };

            var publics = null, internals = null, displayTitleColumn = null;

            if ($.isArray(items) && items.length > 0) {

                if (items.length == 1) {
                    displayTitleColumn = items[0].title != "";
                    publics = {
                        html: [],
                        column: 0,
                        displayTitleColumn: displayTitleColumn, // false
                        items: [$.extend(items[0], { isTitleColumn: true })],
                        totalItems: ns.countItems(items[0].children) + (displayTitleColumn ? 1 : 0),
                        rendered: 0,
                        processed: 0
                    };

                    context.totalItems = publics.totalItems;
                    context.ratio = 1;

                    publics = ns.setColumns(publics, 0, 4);
                }

                if (items.length > 1) {
                    displayTitleColumn = items[0].title != "";
                    publics = {
                        html: [],
                        column: 0,
                        displayTitleColumn: displayTitleColumn,
                        items: [$.extend(items[0], { isTitleColumn: true })],
                        totalItems: ns.countItems(items[0].children) + (displayTitleColumn ? 1 : 0),
                        rendered: 0,
                        processed: 0
                    };
                    publics = ns.setColumns(publics, 0, 4);

                    displayTitleColumn = items[1].title != "";
                    internals = {
                        html: [],
                        displayTitleColumn: displayTitleColumn,
                        items: [$.extend(items[1], { isTitleColumn: true })],
                        totalItems: ns.countItems(items[1].children) + (displayTitleColumn ? 1 : 0),
                        rendered: 0,
                        processed: 0
                    };

                    context.totalItems = internals.totalItems + publics.totalItems;
                    context.ratio = publics.totalItems / context.totalItems;

                    if (context.ratio < 0.25) {
                        // publics: 1/4     internals: 3/4
                        publics = ns.setColumns(publics, 0, 1);
                        internals = ns.setColumns(internals, 1, 3);

                    } else if (0.25 < context.ratio && context.ratio < 0.75) {
                        // publics: 2/4     internals: 2/4
                        publics = ns.setColumns(publics, 0, 2);
                        internals = ns.setColumns(internals, 2, 2);

                    } else {
                        // publics: 3/4     internals: 1/4
                        publics = ns.setColumns(publics, 0, 3);
                        internals = ns.setColumns(internals, 3, 1);
                    }
                }

                ns.log("renderItems=", context.totalItems, ", ratio=", Math.round(context.ratio, 2), ", publics=", publics, ", internals=", internals);

                if (publics != null) {
                    ns.renderChildren(publics, 0, publics.items);
                    context.html.push(publics.html.join(""));
                }

                if (internals != null) {
                    ns.renderChildren(internals, 0, internals.items);
                    context.html.push(internals.html.join(""));
                }

            } else {
                context.html.push('<div class="gs-empty">Keine Elemente gefunden.</div>');
            }

            return context.html.join("");
        },

        setColumns: function (context, offset, maxColumns) {
            if (context.totalItems <= 25) {
                context.totalColumns = Math.min(maxColumns, 1);
            } else if (context.totalItems <= 50) {
                context.totalColumns = Math.min(maxColumns, 2);
            } else {
                context.totalColumns = Math.min(maxColumns, 4);
            }

            context.column = 0;
            context.columnOffset = offset;
            context.itemsPerColumn = Math.ceil(context.totalItems / context.totalColumns);
            return context;
        },

        countItems: function (items) {
            if (items) {
                var count = 0;
                $.each(items, function (i, item) {
                    count += 1 + ns.countItems(item.children);
                });
                return count;
            }
            return 0;
        },

        getColumnCss: function (context, item) {
            var column = context.column,
                columnWithOffset = context.column + (context.columnOffset || 0),
                tot = context.totalColumns,
                displayTitleColumn = context.displayTitleColumn || false,
                isTitleColumn = item.isTitleColumn || false;

            var classes = ["gs-column", "gs-column-" + columnWithOffset];
            if (displayTitleColumn) {
                classes.push("gs-column-withtitle");
            }
            if (columnWithOffset == 0) {
                classes.push("gs-column-first");
            }
            if (column == tot - 1) {
                classes.push("gs-column-last");
            }
            if (columnWithOffset > 0 && isTitleColumn) {
                classes.push("gs-column-border");
            }
            classes = classes.join(" ");

            ns.log("getColumnCss : column=", column, ", totalColumns=", tot, ", isTitleColumn=", isTitleColumn, ", displayTitleColumn=", displayTitleColumn, " => ", classes);
            return classes;
        },

        renderChildren: function (context, level, items) {
            if ($.isArray(items) && items.length > 0) {
                $.each(items, function (i, item) {

                    // navigator
                    var displayName = (item.title || "").replace("_", " ");
                    var tooltip = (item.tooltip || "").replace("_", " ");
                    var isFirstItemInColumn = false;
                    var isTitleColumn = item.isTitleColumn || false;
                    var displayTitleColumn = context.displayTitleColumn || false;
                    var hasUrl = item.url != null;
                    var previousIsTitleColumn = (context.previousItem != null && (context.previousItem.isTitleColumn || false));

                    if (isTitleColumn) {
                        if (context.rendered > 0) {
                            context.html.push('</div>');
                            context.column++;
                        }
                        context.html.push('<div class="');
                        context.html.push(ns.getColumnCss(context, item));
                        context.html.push('">');

                        isFirstItemInColumn = true;
                        context.ItemsInColumnRendered = 0;

                    } else if (context.processed == 0) {
                        context.html.push('<div class="');
                        context.html.push(ns.getColumnCss(context, item));
                        context.html.push('">');

                        isFirstItemInColumn = true;
                        context.ItemsInColumnRendered = 0;

                    } else if (context.ItemsInColumnRendered > 0 && (context.ItemsInColumnRendered % context.itemsPerColumn == 0)) {
                        context.ItemsInColumnRendered = 0;
                        context.column++;

                        context.html.push('</div>');
                        context.html.push('<div class="');
                        context.html.push(ns.getColumnCss(context, item));
                        context.html.push('">');

                        isFirstItemInColumn = true;
                    }

                    var debug = false;
                    if (debug) {
                        ns.log({
                            "displayName": displayName,
                            "tooltip": tooltip,
                            "isFirstItemInColumn": isFirstItemInColumn,
                            "isTitleColumn": isTitleColumn,
                            "hasUrl": hasUrl,
                            "previousIsTitleColumn": previousIsTitleColumn
                        });
                    }

                    if (!isTitleColumn || displayTitleColumn) {
                        var classes = ["gs-item", "gs-level-" + level];
                        if (isTitleColumn) {
                            classes.push("gs-column-title");
                        }
                        if ((isFirstItemInColumn && !isTitleColumn) || previousIsTitleColumn) {
                            classes.push("gs-first");
                        }
                        classes = classes.join(" ");
                        context.html.push('<div class="');
                        context.html.push(classes);
                        context.html.push('">');

                        if (hasUrl) {
                            context.html.push('<a class="gs-item-link" href="');
                            context.html.push(item.url);
                            context.html.push('" title="');
                        } else {
                            context.html.push('<div class="gs-item-link" title="');
                        }
                        context.html.push(tooltip);
                        context.html.push('">');
                        context.html.push('<span class="title">');
                        context.html.push(displayName);
                        context.html.push('</span>');

                        if (isTitleColumn && displayName != "" && item.url != null) {
                            context.html.push('<span class="description">Zur ');
                            context.html.push(displayName);
                            context.html.push(' Startseite</span>');
                        }

                        if (hasUrl) {
                            context.html.push('</a>');
                        } else {
                            context.html.push('</div>');
                        }
                        context.html.push('</div>');

                        context.rendered++;
                    }

                    if (!isTitleColumn) {
                        context.ItemsInColumnRendered++;
                    }

                    context.processed++;
                    context.previousItem = item;

                    if (context.rendered == context.totalItems) {
                        context.html.push('</div>');
                    }

                    ns.log({
                        "Title": displayName,
                        "rendered": context.rendered,
                        "totalItems": context.totalItems
                    });

                    ns.renderChildren(context, level + 1, item.children);
                });
            }
        },

        load: function () {
            var startTime = new Date().getTime();
            var data = {
                url: ns.contextUrl,
                t: startTime
            };

            $.ajax({
                url: ns.serviceUrl,
                type: "GET",
                dataType: "json",
                data: data,
                success: function (result) {
                    var content = ns.renderItems(result);

                    // show the spinner for at least 500ms.
                    var timeSpent = new Date().getTime() - startTime;
                    var minSpinner = 500;

                    if (timeSpent >= minSpinner) {
                        ns.setContent(content);
                    } else {
                        ns.content.animate({ opacity: 1 }, minSpinner - timeSpent, function () {
                            ns.setContent(content);
                        });
                    }
                },
                error: function (xhr, status, errorThrown) {
                    ns.error("error: ", status, "text: ", xhr.responseText, errorThrown);
                }
            });
        },

        setContent: function (content) {
            ns.log("setContent", content.length);
            ns.content.html(content);
        }
    });

    // don't initialise on dom ready event, else there is some screen
    // flickering because the sharepoint content is already visible before.
    $(ns.containerSelector).onAvailable(function () {
        ns.containerAvailable($(this));
    });

})(jQuery);