var PWB_COOKIE="_Search_Result_PWB_Tree";
var EXPAND = "expand-all";
var COLLAPSE = "collapse-all"; // default value for the Location in PWB

jQuery(document).ready(function () {
    jQuery('ul.term-list').each(function () {
        var LiN = jQuery(this).find('li').length;
        if (LiN > 6) {
            jQuery('li', this).eq(5).nextAll().hide().addClass('toggleable');
            jQuery(this).append('<li class="more">More...</li>');
        }
    });
});

// Show summation up to 200 chars.
jQuery(document).ready(function() {
    // Configure/customize these variables.
    var showChar = 200;  // How many characters are shown by default
    var ellipsestext = "... ";
    var moretext = "Read more";
    var lesstext = " Show less";

    // FIXME: highlighting is not working in the summation
    jQuery('.summation').each(function() {
        var content = jQuery(this).text();

        if(content.length > showChar) {
            var c = content.substr(0, showChar);
            var h = content.substr(showChar, content.length - showChar);
            var html = jQuery.trim(c) + '<span class="moreellipses">' + ellipsestext+ '</span><span class="morecontent"><span>' + h + '</span><a href="javascript:void(0);" class="morelink">' + moretext + '</a></span>';
            jQuery(this).html(html);
        }
    });

    jQuery(".morelink").click(function(){
        if(jQuery(this).hasClass("less")) {
            jQuery(this).removeClass("less");
            jQuery(this).html(moretext);
        } else {
            jQuery(this).addClass("less");
            jQuery(this).html(lesstext);
        }

        jQuery(this).parent().prev().toggle();
        jQuery(this).prev().toggle();
        return false;
    });
});

jQuery(document).ready(function () {
    jQuery('ul.term-list').on('click', '.more', function () {
        if (jQuery(this).hasClass('less')) {
            jQuery(this).text('More...').removeClass('less');
        } else {
            jQuery(this).text('Less...').addClass('less');
        }
        jQuery(this).siblings('li.toggleable').slideToggle();
    });
});

jQuery(document).ready(function () {
    jQuery('#search_form').submit(function (e) {
        if (!jQuery('#local-searchbox').val()) {
            e.preventDefault();
        } else if (jQuery('#local-searchbox').val().match(/^\s*jQuery/)) {
            e.preventDefault();
        }
    });
});

jQuery(document).ready(function () {
    jQuery(".plus").click(function () {
        $plus = jQuery(this);
        $treeLpwb = $plus.nextAll().eq(0);
        $treeLpwb.slideToggle(500, function () {
            if ($treeLpwb.is(":visible")) {
                //return $plus.find(".sprite-plus").attr("class", "sprite-resize-small sprite sprite-minus");
                return $plus.find(".fa-plus-square-o").attr("class", "fa fa-minus-square-o");
            } else {
                //return $plus.find(".sprite-minus").attr("class", "sprite-resize-small sprite sprite-plus");
                return $plus.find(".fa-minus-square-o").attr("class", "fa fa-plus-square-o");
            }
        });
    });
});

jQuery(document).ready(function () {
    var availableSpeciesSel = jQuery('[id*=availableSpeciesSel]');
    availableSpeciesSel.ready(function () {
        var DEFAULT_SPECIES = 'Homo sapiens';

        /** Check if hash is present in the URL **/
        var hash = decodeURIComponent(window.location.hash);
        var defaulLoaded = false;
        var tplSpecies = jQuery("div[class*=tplSpe_]");
        if (hash == "") {
            tplSpecies.each(function (index, value) {
                var item = jQuery(value).attr("class");
                if (item == "tplSpe_" + DEFAULT_SPECIES.replace(" ", "_")) {
                    availableSpeciesSel.val(DEFAULT_SPECIES.replace(" ", "_"));
                    jQuery("." + item).show();

                    //change url
                    if (availableSpeciesSel.val() != null) {
                        window.location.hash = "#" + encodeURIComponent(DEFAULT_SPECIES);
                    }

                    defaulLoaded = true;
                } else {
                    jQuery("." + item).css("display", "none");
                }
            });

            if (!defaulLoaded) {
                tplSpecies.css("display", "block");
            }
        } else {
            hash = hash.replace("#", "").replace(" ", "_");

            var tplSelected = jQuery(".tplSpe_" + hash);
            // hash has been change manually into a non-existing value. Pick the first one which is human
            if (tplSelected.val() == null) {

                jQuery("[id*=availableSpeciesSel] > option").each(function (index, value) {
                    var item = jQuery(value).attr("value");

                    tplSpecies.val(item);

                    jQuery(".tplSpe_" + item).show();
                    window.location.hash = "#" + encodeURIComponent(item.replace("_", " "));

                    return false;
                });
            } else {
                tplSpecies.val(hash);
                tplSelected.show();
            }
        }
    });
});

jQuery(document).ready(function () {
    jQuery('[id*=availableSpeciesSel]').on('change', function () {
        var selectedSpecies = this.value;

        // hide everything
        jQuery("div[class*=tplSpe_]").each(function (index, element) {
            jQuery(element).hide();
        });

        // show div related to the species
        jQuery(".tplSpe_" + selectedSpecies).show();

        // change anchor in the URL
        window.location.hash = "#" + encodeURIComponent(selectedSpecies.replace("_", " "));

    });
});

jQuery(document).ready(function () {
    // expand and collapse all feature
    jQuery("#pwb_toggle").click(function () {
        var action = jQuery("#pwb_toggle").attr("class");
        togglePwbTree(action);
        writeCookie(PWB_COOKIE, action);
    });
});

function togglePwbTree(action){
    var treeLpwb = jQuery("div.tree-lpwb");
    treeLpwb.each(function (index, element) {
        if (action == EXPAND) {
            jQuery(element).show();
        } else {
            jQuery(element).hide(100);
        }
    });

    var pwbToggle = jQuery("#pwb_toggle");
    if (action == COLLAPSE) {
        jQuery(".fa-minus-square-o").attr("class", "fa fa-plus-square-o");
        pwbToggle.text("Expand All");
        pwbToggle.attr("class", EXPAND);
    } else {
        jQuery(".fa-plus-square-o").attr("class", "fa fa-minus-square-o");
        pwbToggle.text("Collapse All");
        pwbToggle.attr("class", COLLAPSE);
    }
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function writeCookie(key, value) {
    var date = new Date();
    // Default at 365 days.
    var days = 365;
    // Get unix milliseconds at current time plus number of days
    date.setTime(+ date + (days * 86400000)); //24 * 60 * 60 * 1000
    document.cookie = key + "=" + value + "; expires=" + date.toGMTString() + ";";
}

function openSideNav() {
    jQuery("#search-filter-sidenav").css({width: "270px", left: "0" });
    jQuery(".sidenav-bg").css('display', 'block');
    lockBackground()
}

/* Set the width of the side navigation to 0 */
function closeSideNav() {
    jQuery("#search-filter-sidenav").css({width: "0", left: "" });
    jQuery(".sidenav-bg").css('display', 'none');
    releaseBackground();
}

function openSchemaSideNav() {
    var width="350px";
    if (window.matchMedia('screen and (max-width: 500px)').matches) {
        width="100%";
    }
    jQuery(".schema-tree-mobile").html(jQuery(".schema-tree-ph").html());
    jQuery("#schema-sidenav").css({width: width, left: "0" });
    jQuery(".sidenav-bg").css('display', 'block');
    lockBackground()
}

/* Set the width of the side navigation to 0 */
function closeSchemaSideNav() {
    jQuery("#schema-sidenav").css({width: "0", left: "" });
    jQuery(".sidenav-bg").css('display', 'none');
    releaseBackground();
}

/* Lock background while scrolling in a popup or modal */
function lockBackground() {
    jQuery("html").addClass("modal-open");
    jQuery("body").addClass("modal-open");
}

function releaseBackground() {
    jQuery("html").removeClass("modal-open");
    jQuery("body").removeClass("modal-open");
}