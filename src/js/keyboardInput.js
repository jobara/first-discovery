/*
Copyright 2015 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

(function () {

    "use strict";

    fluid.registerNamespace("gpii.firstDiscovery");

    fluid.defaults("gpii.firstDiscovery.usKeymap", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        invokers: {
            isShiftEvent: {
                funcName: "gpii.firstDiscovery.usKeymap.isShiftEvent",
                args: ["{that}", "{arguments}.0"]
            },
            isLowerCaseLetter: {
                funcName: "gpii.firstDiscovery.usKeymap.isLowerCaseLetter",
                args: ["{that}", "{arguments}.0"]
            },
            canShiftChar: {
                funcName: "gpii.firstDiscovery.usKeymap.canShiftChar",
                args: ["{that}", "{arguments}.0"]
            },
            getShiftedChar: {
                funcName: "gpii.firstDiscovery.usKeymap.getShiftedChar",
                args: ["{that}", "{arguments}.0"]
            }
        },
        members: {
            charCodeLowerCaseA: 97,
            charCodeLowerCaseZ: 122,
            shiftKeyCode: 16,
            shiftTable: {
                "`": "~",
                "1": "!",
                "2": "@",
                "3": "#",
                "4": "$",
                "5": "%",
                "6": "^",
                "7": "&",
                "8": "*",
                "9": "(",
                "0": ")",
                "-": "_",
                "=": "+",
                "[": "{",
                "]": "}",
                "\\": "|",
                ";": ":",
                "'": "\"",
                ",": "<",
                ".": ">",
                "/": "?"
            }
        }
    });

    gpii.firstDiscovery.usKeymap.isShiftEvent = function (keymap, e) {
        return e.which === keymap.shiftKeyCode;
    };

    gpii.firstDiscovery.usKeymap.isLowerCaseLetter = function (keymap, ch) {
        var charCode = ch.charCodeAt(0);
        return (charCode >= keymap.charCodeLowerCaseA) &&
            (charCode <= keymap.charCodeLowerCaseZ);
    };

    gpii.firstDiscovery.usKeymap.canShiftChar = function (keymap, ch) {
        return gpii.firstDiscovery.usKeymap.isLowerCaseLetter(keymap, ch) ||
            (keymap.shiftTable[ch] !== undefined);
    };

    gpii.firstDiscovery.usKeymap.getShiftedChar = function (keymap, ch) {
        if (gpii.firstDiscovery.usKeymap.isLowerCaseLetter(keymap, ch)) {
            return ch.toUpperCase();
        } else {
            return keymap.shiftTable[ch];
        }
    };

    fluid.defaults("gpii.firstDiscovery.keyboardInput", {
        gradeNames: ["fluid.viewRelayComponent", "gpii.firstDiscovery.attachTooltip", "gpii.firstDiscovery.msgLookup", "autoInit"],
        tooltipContentMap: {
            "": "keyboardInputTooltip"  // use "" to select the container
        },
        model: {
            stickyKeysEnabled: false,
            shiftLatched: false,
            userInput: ""
        },
        modelListeners: {
            "stickyKeysEnabled.unlatchShift": "{that}.unlatchShift",
            "shiftLatched.updateShiftLatchedClass": "{that}.updateShiftLatchedClass"
        },
        events: {
            shiftKeydown: null
        },
        styles: {
            shiftLatched: "gpii-keyboardInput-shiftLatched"
        },
        invokers: {
            "unlatchShift": {
                changePath: "shiftLatched",
                value: false
            },
            "updateShiftLatchedClass": {
                "this": "{that}.container",
                method: "toggleClass",
                args: ["{that}.options.styles.shiftLatched", "{that}.model.shiftLatched"]
            },
            "openTooltipIfNotFocused": {
                funcName: "gpii.firstDiscovery.keyboardInput.openTooltipIfNotFocused",
                args: ["{that}", "{that}.container"]
            }
        },
        listeners: {
            "onCreate.registerShiftListener": {
                funcName: "gpii.firstDiscovery.keyboardInput.registerShiftListener",
                args: ["{that}", "{that}.container", "{keymap}"]
            },
            "onCreate.registerKeypressListener": {
                funcName: "gpii.firstDiscovery.keyboardInput.registerKeypressListener",
                args: ["{that}", "{that}.container", "{keymap}"]
            },
            "onCreate.registerChangeListener": {
                funcName: "gpii.firstDiscovery.keyboardInput.registerChangeListener",
                args: ["{that}", "{that}.container"]
            },
            // begin TOOLTIP HANDLER CONFIGURATION
            //
            // We want to control the tooltip opening ourselves so we
            // remove the existing mouseover and focusin handlers and
            // add our own instead.  We leave the mouseleave and
            // focusout handlers alone as the jQuery Tooltip widget
            // rebinds these each time the tooltip is opened.
            "onCreate.removeMouseover": {
                "this": "{that}.container",
                method: "off",
                args: ["mouseover"],
                priority: 4
            },
            "onCreate.removeFocusin": {
                "this": "{that}.container",
                method: "off",
                args: ["focusin"],
                priority: 3
            },
            "onCreate.mouseoveHandler": {
                "this": "{that}.container",
                method: "mouseover",
                args: ["{that}.openTooltipIfNotFocused"],
                priority: 2
            },
            "onCreate.focusinHandler": {
                "this": "{that}.container",
                method: "focusin",
                args: ["{that}.tooltip.close"],
                priority: 1
            }
            // END TOOLTIP HANDLER CONFIGURATION
        },
        components: {
            keymap: {
                type: "gpii.firstDiscovery.usKeymap"
            }
        }
    });

    gpii.firstDiscovery.keyboardInput.charFromKeypress = function (e) {
        return e.which ? String.fromCharCode(e.which) : "";
    };

    gpii.firstDiscovery.keyboardInput.registerShiftListener = function (that, input, keymap) {
        input.keydown(function (e) {
            if (keymap.isShiftEvent(e)) {
                that.events.shiftKeydown.fire();
                if (that.model.stickyKeysEnabled) {
                    // toggle the shiftLatched state
                    that.applier.change("shiftLatched", !(that.model.shiftLatched));
                }
            }
        });
    };

    gpii.firstDiscovery.keyboardInput.registerKeypressListener = function (that, input, keymap) {
        input.keypress(function (e) {
            e.preventDefault();
            var ch = gpii.firstDiscovery.keyboardInput.charFromKeypress(e);
            if (that.model.stickyKeysEnabled && that.model.shiftLatched) {
                that.unlatchShift();
                if (keymap.canShiftChar(ch)) {
                    ch = keymap.getShiftedChar(ch);
                }
            }
            if (ch !== "") {
                input.val(ch);
                // programmatic change of the input value does not
                // fire a change event, so we trigger it explicitly
                input.triggerHandler("change");
            }
        });
    };

    gpii.firstDiscovery.keyboardInput.registerChangeListener = function (that, input) {
        input.change(function () {
            that.applier.change("userInput", input.val());
        });
    };

    gpii.firstDiscovery.keyboardInput.openTooltipIfNotFocused = function (that, input) {
        if (!input.is(":focus")) {
            that.tooltip.open();
        }
    };

})();