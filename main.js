define("lib/common", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.TAU = Math.PI * 2.0;
    var Terminator = (function () {
        function Terminator() {
            this.terminables = [];
        }
        Terminator.prototype["with"] = function (terminable) {
            this.terminables.push(terminable);
            return terminable;
        };
        Terminator.prototype.terminate = function () {
            while (this.terminables.length) {
                this.terminables.pop().terminate();
            }
        };
        return Terminator;
    }());
    exports.Terminator = Terminator;
    var ObservableImpl = (function () {
        function ObservableImpl() {
            this.observers = [];
        }
        ObservableImpl.prototype.notify = function (value) {
            this.observers.forEach(function (observer) { return observer(value); });
        };
        ObservableImpl.prototype.addObserver = function (observer) {
            var _this = this;
            this.observers.push(observer);
            return { terminate: function () { return _this.removeObserver(observer); } };
        };
        ObservableImpl.prototype.removeObserver = function (observer) {
            var index = this.observers.indexOf(observer);
            if (-1 < index) {
                this.observers.splice(index, 1);
                return true;
            }
            return false;
        };
        ObservableImpl.prototype.terminate = function () {
            this.observers.splice(0, this.observers.length);
        };
        return ObservableImpl;
    }());
    exports.ObservableImpl = ObservableImpl;
    var Linear = (function () {
        function Linear(min, max) {
            this.min = min;
            this.max = max;
            this.range = max - min;
        }
        Linear.prototype.x = function (y) {
            return (y - this.min) / this.range;
        };
        Linear.prototype.y = function (x) {
            return this.min + x * this.range;
        };
        Linear.prototype.clamp = function (y) {
            return Math.min(this.max, Math.max(this.min, y));
        };
        Linear.Identity = new Linear(0.0, 1.0);
        Linear.Bipolar = new Linear(-1.0, 1.0);
        Linear.Percent = new Linear(0.0, 100.0);
        return Linear;
    }());
    exports.Linear = Linear;
    var LinearInteger = (function () {
        function LinearInteger(min, max) {
            this.max = max | 0;
            this.min = min | 0;
            this.range = max - min;
        }
        LinearInteger.prototype.x = function (y) {
            return (y - this.min) / this.range;
        };
        LinearInteger.prototype.y = function (x) {
            return (this.min + Math.round(x * this.range)) | 0;
        };
        LinearInteger.prototype.clamp = function (y) {
            return Math.min(this.max, Math.max(this.min, y));
        };
        LinearInteger.Percent = new Linear(0, 100);
        return LinearInteger;
    }());
    exports.LinearInteger = LinearInteger;
    var Exp = (function () {
        function Exp(min, max) {
            this.max = max;
            this.min = min;
            this.range = Math.log(max / min);
        }
        Exp.prototype.x = function (y) {
            return Math.log(y / this.min) / this.range;
        };
        Exp.prototype.y = function (x) {
            return this.min * Math.exp(x * this.range);
        };
        Exp.prototype.clamp = function (y) {
            return Math.min(this.max, Math.max(this.min, y));
        };
        return Exp;
    }());
    exports.Exp = Exp;
    var Boolean = (function () {
        function Boolean() {
        }
        Boolean.prototype.x = function (y) {
            return y ? 1.0 : 0.0;
        };
        Boolean.prototype.y = function (x) {
            return x >= 0.5;
        };
        Boolean.prototype.clamp = function (y) {
            return y;
        };
        return Boolean;
    }());
    exports.Boolean = Boolean;
    var Volume = (function () {
        function Volume(min, mid, max) {
            if (min === void 0) { min = -72.0; }
            if (mid === void 0) { mid = -12.0; }
            if (max === void 0) { max = 0.0; }
            this.min = min;
            this.mid = mid;
            this.max = max;
            var min2 = min * min;
            var max2 = max * max;
            var mid2 = mid * mid;
            var tmp0 = min + max - 2.0 * mid;
            var tmp1 = max - mid;
            this.a = ((2.0 * max - mid) * min - mid * max) / tmp0;
            this.b = (tmp1 * min2 + (mid2 - max2) * min + mid * max2 - mid2 * max)
                / (min2 + (2.0 * max - 4.0 * mid) * min + max2 - 4.0 * mid * max + 4 * mid2);
            this.c = -tmp1 / tmp0;
        }
        Volume.prototype.y = function (x) {
            if (0.0 >= x) {
                return Number.NEGATIVE_INFINITY;
            }
            if (1.0 <= x) {
                return this.max;
            }
            return this.a - this.b / (x + this.c);
        };
        Volume.prototype.x = function (y) {
            if (this.min >= y) {
                return 0.0;
            }
            if (this.max <= y) {
                return 1.0;
            }
            return -this.b / (y - this.a) - this.c;
        };
        Volume.prototype.clamp = function (y) {
            return Math.min(this.max, Math.max(this.min, y));
        };
        Volume.Default = new Volume();
        return Volume;
    }());
    exports.Volume = Volume;
    var PrintMapping = (function () {
        function PrintMapping(parser, printer) {
            this.parser = parser;
            this.printer = printer;
        }
        PrintMapping.createPrintMapping = function (parser, numFraction) {
            return new PrintMapping(parser, function (mapping, unipolar) {
                return mapping.y(unipolar).toFixed(numFraction);
            });
        };
        PrintMapping.prototype.parse = function (mapping, text) {
            return this.parser(mapping, text);
        };
        PrintMapping.prototype.print = function (mapping, unipolar) {
            return this.printer(mapping, unipolar);
        };
        PrintMapping.UnipolarParser = function (mapping, text) {
            if (text.includes("%")) {
                return mapping.y(parseFloat(text) / 100.0);
            }
            var value = parseFloat(text);
            if (isNaN(value)) {
                return NaN;
            }
            return mapping.y(Math.min(1.0, Math.max(0.0, mapping.x(value))));
        };
        PrintMapping.BipolarParser = function (mapping, text) {
            var float = parseFloat(text);
            if (isNaN(float)) {
                return NaN;
            }
            return mapping.y(Math.min(1.0, Math.max(0.0, float / 200.0 + 0.5)));
        };
        PrintMapping.UnipolarPercent = new PrintMapping(function (mapping, text) { return mapping.y(parseFloat(text) / 100.0); }, function (mapping, unipolar) { return (mapping.y(unipolar) * 100.0).toFixed(1); });
        PrintMapping.NoFloat = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 0);
        PrintMapping.OneFloats = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 1);
        PrintMapping.TwoFloats = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 2);
        PrintMapping.ThreeFloats = PrintMapping.createPrintMapping(PrintMapping.UnipolarParser, 3);
        return PrintMapping;
    }());
    exports.PrintMapping = PrintMapping;
    var ObservableValue = (function () {
        function ObservableValue(value) {
            this.value = value;
            this.observable = new ObservableImpl();
        }
        ObservableValue.prototype.get = function () {
            return this.value;
        };
        ObservableValue.prototype.set = function (value) {
            if (this.value === value) {
                return false;
            }
            this.value = value;
            this.observable.notify(this);
            return true;
        };
        ObservableValue.prototype.addObserver = function (observer) {
            return this.observable.addObserver(observer);
        };
        ObservableValue.prototype.removeObserver = function (observer) {
            return this.observable.removeObserver(observer);
        };
        ObservableValue.prototype.terminate = function () {
            this.observable.terminate();
        };
        return ObservableValue;
    }());
    exports.ObservableValue = ObservableValue;
    var NumericStepper = (function () {
        function NumericStepper(step) {
            if (step === void 0) { step = 1; }
            this.step = step;
        }
        NumericStepper.prototype.decrease = function (value) {
            value.set(Math.round((value.get() - this.step) / this.step) * this.step);
        };
        NumericStepper.prototype.increase = function (value) {
            value.set(Math.round((value.get() + this.step) / this.step) * this.step);
        };
        NumericStepper.Integer = new NumericStepper(1);
        NumericStepper.FloatPercent = new NumericStepper(0.01);
        return NumericStepper;
    }());
    exports.NumericStepper = NumericStepper;
    var Parameter = (function () {
        function Parameter(mapping, value) {
            if (mapping === void 0) { mapping = Linear.Identity; }
            if (value === void 0) { value = 0.5; }
            this.mapping = mapping;
            this.value = value;
            this.observable = new ObservableImpl();
        }
        Parameter.prototype.get = function () {
            return this.value;
        };
        Parameter.prototype.unipolar = function () {
            return this.mapping.x(this.value);
        };
        Parameter.prototype.set = function (value) {
            value = this.mapping.clamp(value);
            if (this.value === value) {
                return false;
            }
            this.value = value;
            this.observable.notify(this);
            return true;
        };
        Parameter.prototype.addObserver = function (observer) {
            return this.observable.addObserver(observer);
        };
        Parameter.prototype.removeObserver = function (observer) {
            return this.observable.removeObserver(observer);
        };
        Parameter.prototype.terminate = function () {
            this.observable.terminate();
        };
        return Parameter;
    }());
    exports.Parameter = Parameter;
});
define("rotary/model", ["require", "exports", "lib/common"], function (require, exports, common_1) {
    "use strict";
    exports.__esModule = true;
    var RotaryModel = (function () {
        function RotaryModel() {
            this.terminator = new common_1.Terminator();
            this.radiusMin = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(0, 128), 20));
            this.tracks = [];
            this.randomize();
        }
        RotaryModel.prototype.randomize = function () {
            this.tracks.splice(0, this.tracks.length);
            for (var i = 0; i < 12; i++) {
                var segments = 1 + Math.floor(Math.random() * 9);
                var lengthRatioExp = -Math.floor(Math.random() * 3);
                var lengthRatio = 0 === lengthRatioExp ? 1.0 : Math.random() < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp);
                var width = Math.random() < 0.1 ? 24.0 : 12.0;
                var widthPadding = Math.random() < 0.1 ? 0.0 : 3.0;
                var length_1 = Math.random() < 0.1 ? 0.75 : 1.0;
                var fill = 2 === segments ? Fill.Positive : Math.random() < 0.2 ? Fill.Stroke : Fill.Flat;
                var trackModel = new RotaryTrackModel();
                trackModel.segments.set(0 === lengthRatioExp ? 1 : segments);
                trackModel.width.set(width);
                trackModel.widthPadding.set(widthPadding);
                trackModel.length.set(length_1);
                trackModel.lengthRatio.set(lengthRatio);
                trackModel.fill.set(fill);
                trackModel.movement.set(exports.randomMovement());
                trackModel.hue.set(Math.random());
                this.tracks.push(trackModel);
            }
        };
        RotaryModel.prototype.createTrack = function (insertIndex) {
            if (insertIndex === void 0) { insertIndex = Number.MAX_SAFE_INTEGER; }
            var track = new RotaryTrackModel();
            this.tracks.splice(insertIndex, 0, track);
            return track;
        };
        RotaryModel.prototype.copyTrack = function (source, insertIndex) {
            if (insertIndex === void 0) { insertIndex = Number.MAX_SAFE_INTEGER; }
            var copy = this.createTrack(insertIndex);
            copy.segments.set(source.segments.get());
            copy.fill.set(source.fill.get());
            copy.length.set(source.length.get());
            copy.lengthRatio.set(source.lengthRatio.get());
            copy.width.set(source.width.get());
            copy.widthPadding.set(source.widthPadding.get());
            copy.phase.set(source.phase.get());
            copy.movement.set(source.movement.get());
            copy.reverse.set(source.reverse.get());
            return copy;
        };
        RotaryModel.prototype.removeTrack = function (track) {
            var index = this.tracks.indexOf(track);
            if (-1 < index) {
                this.tracks.splice(index, 1);
                track.terminate();
            }
        };
        RotaryModel.prototype.measureRadius = function () {
            var radiusMin = this.radiusMin.get();
            for (var i = 0; i < this.tracks.length; i++) {
                var track = this.tracks[i];
                radiusMin += track.width.get() + track.widthPadding.get();
            }
            return radiusMin;
        };
        RotaryModel.prototype.terminate = function () {
            this.terminator.terminate();
        };
        return RotaryModel;
    }());
    exports.RotaryModel = RotaryModel;
    var Fill;
    (function (Fill) {
        Fill[Fill["Flat"] = 0] = "Flat";
        Fill[Fill["Stroke"] = 1] = "Stroke";
        Fill[Fill["Positive"] = 2] = "Positive";
        Fill[Fill["Negative"] = 3] = "Negative";
    })(Fill = exports.Fill || (exports.Fill = {}));
    var AccAndStop = function (exp) { return function (x) { return Math.pow(x, exp); }; };
    var OddShape = function (shape) {
        var o = Math.pow(2.0, shape);
        var c = Math.pow(2.0, o - 1);
        return function (x) { return c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), o) + 0.5; };
    };
    exports.Movements = new Map([
        ["Linear", function (x) { return x; }],
        ["Sine", function (x) { return Math.sin(x * Math.PI); }],
        ["StopAndGo", function (x) { return 1.0 - Math.min(1.0, 2.0 * (2.0 * x - Math.floor(2.0 * x))); }],
        ["AccAndStop 2", AccAndStop(2.0)],
        ["AccAndStop 3", AccAndStop(3.0)],
        ["OddShape -1", OddShape(-1.0)],
        ["OddShape 1", OddShape(1.0)],
        ["OddShape 2", OddShape(2.0)],
    ]);
    exports.randomMovement = function () {
        var array = Array.from(exports.Movements);
        return array[Math.floor(Math.random() * array.length)][1];
    };
    exports.Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]]);
    var RotaryTrackModel = (function () {
        function RotaryTrackModel() {
            var _this = this;
            this.terminator = new common_1.Terminator();
            this.gradient = [];
            this.gradientNeedsUpdate = true;
            this.segments = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(1, 128), 8));
            this.width = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(1, 128), 12));
            this.widthPadding = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(0, 128), 0));
            this.length = this.terminator["with"](new common_1.Parameter(common_1.Linear.Identity, 1.0));
            this.lengthRatio = this.terminator["with"](new common_1.Parameter(common_1.Linear.Identity, 0.5));
            this.phase = this.terminator["with"](new common_1.Parameter(common_1.Linear.Identity, 0.0));
            this.fill = this.terminator["with"](new common_1.ObservableValue(Fill.Flat));
            this.movement = this.terminator["with"](new common_1.ObservableValue(exports.Movements.values().next().value));
            this.reverse = this.terminator["with"](new common_1.ObservableValue(false));
            this.hue = this.terminator["with"](new common_1.ObservableValue((0.0)));
            this.saturation = this.terminator["with"](new common_1.ObservableValue((0.0)));
            this.lightness = this.terminator["with"](new common_1.ObservableValue((1.0)));
            this.terminator["with"](this.hue.addObserver(function () { return _this.gradientNeedsUpdate = true; }));
            this.terminator["with"](this.saturation.addObserver(function () { return _this.gradientNeedsUpdate = true; }));
            this.terminator["with"](this.lightness.addObserver(function () { return _this.gradientNeedsUpdate = true; }));
        }
        RotaryTrackModel.prototype.opaque = function () {
            if (this.gradientNeedsUpdate)
                this.updateGradient();
            return this.gradient[0];
        };
        RotaryTrackModel.prototype.transparent = function () {
            if (this.gradientNeedsUpdate)
                this.updateGradient();
            return this.gradient[1];
        };
        RotaryTrackModel.prototype.terminate = function () {
            this.terminator.terminate();
        };
        RotaryTrackModel.prototype.updateGradient = function () {
            var hue = this.hue.get() * 360;
            var saturation = this.saturation.get() * 100.0;
            var lightness = this.lightness.get() * 100.0;
            this.gradient[0] = "hsla(" + hue + ", " + saturation + "%, " + lightness + "%, 1.0)";
            this.gradient[1] = "hsla(" + hue + ", " + saturation + "%, " + lightness + "%, 0.0)";
            this.gradientNeedsUpdate = false;
        };
        return RotaryTrackModel;
    }());
    exports.RotaryTrackModel = RotaryTrackModel;
});
define("dom/common", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var Dom = (function () {
        function Dom() {
        }
        Dom.bindEventListener = function (target, type, listener, options) {
            target.addEventListener(type, listener, options);
            return { terminate: function () { return target.removeEventListener(type, listener, options); } };
        };
        Dom.insertElement = function (parent, child, index) {
            if (index === void 0) { index = Number.MAX_SAFE_INTEGER; }
            if (index >= parent.children.length) {
                parent.appendChild(child);
            }
            else {
                parent.insertBefore(child, parent.children[index]);
            }
        };
        Dom.emptyElement = function (element) {
            while (element.hasChildNodes()) {
                element.lastChild.remove();
            }
        };
        Dom.configRepeatButton = function (button, callback) {
            var mouseDownListener = function () {
                var lastTime = Date.now();
                var delay = 500.0;
                var repeat = function () {
                    if (!isNaN(lastTime)) {
                        if (Date.now() - lastTime > delay) {
                            lastTime = Date.now();
                            delay *= 0.75;
                            callback();
                        }
                        requestAnimationFrame(repeat);
                    }
                };
                requestAnimationFrame(repeat);
                callback();
                window.addEventListener("mouseup", function () {
                    lastTime = NaN;
                    delay = Number.MAX_VALUE;
                }, { once: true });
            };
            button.addEventListener("mousedown", mouseDownListener);
            return { terminate: function () { return button.removeEventListener("mousedown", mouseDownListener); } };
        };
        return Dom;
    }());
    exports.Dom = Dom;
});
define("dom/inputs", ["require", "exports", "dom/common", "lib/common"], function (require, exports, common_2, common_3) {
    "use strict";
    exports.__esModule = true;
    var Checkbox = (function () {
        function Checkbox(element, value) {
            this.element = element;
            this.value = value;
            this.terminator = new common_3.Terminator();
            this.init();
        }
        Checkbox.prototype.init = function () {
            var _this = this;
            this.element.checked = this.value.get();
            this.terminator["with"](common_2.Dom.bindEventListener(this.element, "change", function () { return _this.value.set(_this.element.checked); }));
            this.terminator["with"](this.value.addObserver(function (value) { return _this.element.checked = value.get(); }));
        };
        Checkbox.prototype.terminate = function () {
            this.terminator.terminate();
        };
        return Checkbox;
    }());
    exports.Checkbox = Checkbox;
    var SelectInput = (function () {
        function SelectInput(select, map, value) {
            var _this = this;
            this.select = select;
            this.map = map;
            this.value = value;
            this.options = new Map();
            this.terminator = new common_3.Terminator();
            this.values = [];
            this.terminator["with"](common_2.Dom.bindEventListener(select, "change", function () {
                value.set(_this.values[select.selectedIndex]);
            }));
            this.terminator["with"](value.addObserver(function (value) {
                _this.options.get(value.get()).selected = true;
            }));
            this.populate();
        }
        SelectInput.prototype.populate = function () {
            var _this = this;
            this.map.forEach(function (some, key) {
                var optionElement = document.createElement("OPTION");
                optionElement.textContent = key;
                optionElement.selected = some === _this.value.get();
                _this.select.appendChild(optionElement);
                _this.values.push(some);
                _this.options.set(some, optionElement);
            });
        };
        SelectInput.prototype.terminate = function () {
            this.terminator.terminate();
        };
        return SelectInput;
    }());
    exports.SelectInput = SelectInput;
    var NumericStepperInput = (function () {
        function NumericStepperInput(parent, parameter, printMapping, stepper, unit) {
            this.parent = parent;
            this.parameter = parameter;
            this.printMapping = printMapping;
            this.stepper = stepper;
            this.unit = unit;
            this.terminator = new common_3.Terminator();
            var buttons = this.parent.querySelectorAll("button");
            this.decreaseButton = buttons.item(0);
            this.increaseButton = buttons.item(1);
            this.input = this.parent.querySelector("input[type=text]");
            this.connect();
            this.update();
        }
        NumericStepperInput.prototype.connect = function () {
            var _this = this;
            this.terminator["with"](this.parameter.addObserver(function () { return _this.update(); }));
            this.terminator["with"](common_2.Dom.configRepeatButton(this.decreaseButton, function () { return _this.stepper.decrease(_this.parameter); }));
            this.terminator["with"](common_2.Dom.configRepeatButton(this.increaseButton, function () { return _this.stepper.increase(_this.parameter); }));
            this.terminator["with"](common_2.Dom.bindEventListener(this.input, "focusin", function (focusEvent) {
                var blur = (function () {
                    var lastFocus = focusEvent.relatedTarget;
                    return function () {
                        _this.input.setSelectionRange(0, 0);
                        if (lastFocus === null) {
                            _this.input.blur();
                        }
                        else {
                            lastFocus.focus();
                        }
                    };
                })();
                var keyboardListener = function (event) {
                    switch (event.key) {
                        case "ArrowUp": {
                            event.preventDefault();
                            _this.stepper.increase(_this.parameter);
                            _this.input.select();
                            break;
                        }
                        case "ArrowDown": {
                            event.preventDefault();
                            _this.stepper.decrease(_this.parameter);
                            _this.input.select();
                            break;
                        }
                        case "Escape": {
                            event.preventDefault();
                            _this.update();
                            blur();
                            break;
                        }
                        case "Enter": {
                            event.preventDefault();
                            var number = _this.parse();
                            if (isNaN(number) || !_this.parameter.set(number)) {
                                _this.update();
                            }
                            blur();
                        }
                    }
                };
                _this.input.addEventListener("focusout", function () {
                    return _this.input.removeEventListener("keydown", keyboardListener);
                }, { once: true });
                _this.input.addEventListener("keydown", keyboardListener);
                window.addEventListener("mouseup", function () {
                    if (_this.input.selectionStart === _this.input.selectionEnd)
                        _this.input.select();
                }, { once: true });
            }));
        };
        NumericStepperInput.prototype.parse = function () {
            return this.printMapping.parse(this.parameter.mapping, this.input.value.replace(this.unit, "").trim());
        };
        NumericStepperInput.prototype.update = function () {
            this.input.value = this.printMapping.print(this.parameter.mapping, this.parameter.unipolar()) + this.unit;
        };
        NumericStepperInput.prototype.terminate = function () {
            this.terminator.terminate();
        };
        return NumericStepperInput;
    }());
    exports.NumericStepperInput = NumericStepperInput;
});
define("rotary/view", ["require", "exports", "lib/common", "rotary/model", "dom/inputs", "dom/common"], function (require, exports, common_4, model_1, inputs_1, common_5) {
    "use strict";
    exports.__esModule = true;
    var RotaryView = (function () {
        function RotaryView(tracksContainer, trackTemplate, rotary) {
            var _this = this;
            this.tracksContainer = tracksContainer;
            this.trackTemplate = trackTemplate;
            this.rotary = rotary;
            this.terminator = new common_4.Terminator();
            this.map = new Map();
            this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("[data-parameter='start-radius']"), rotary.radiusMin, common_4.PrintMapping.NoFloat, new common_4.NumericStepper(1), "px"));
            rotary.tracks.forEach(function (track) { return _this.createView(track); });
            this.updateOrder();
        }
        RotaryView.create = function (document, rotary) {
            var tracksContainer = document.querySelector(".tracks");
            var trackTemplate = document.querySelector(".track");
            trackTemplate.remove();
            return new RotaryView(tracksContainer, trackTemplate, rotary);
        };
        RotaryView.prototype.draw = function (context, position) {
            var radiusMin = this.rotary.radiusMin.get();
            for (var i = 0; i < this.rotary.tracks.length; i++) {
                var view = this.map.get(this.rotary.tracks[i]);
                view.draw(context, radiusMin, position);
                radiusMin += view.model.width.get() + view.model.widthPadding.get();
            }
        };
        RotaryView.prototype.createView = function (model) {
            this.map.set(model, new RotaryTrackView(this, this.trackTemplate.cloneNode(true), model));
        };
        RotaryView.prototype.copyTrack = function (view) {
            var index = this.rotary.tracks.indexOf(view.model);
            console.assert(-1 !== index, "could find model");
            this.createView(this.rotary.copyTrack(view.model, index + 1));
            this.updateOrder();
        };
        RotaryView.prototype.newTrackAfter = function (view) {
            var index = this.rotary.tracks.indexOf(view.model);
            console.assert(-1 !== index, "could find model");
            this.createView(this.rotary.createTrack(index + 1));
            this.updateOrder();
        };
        RotaryView.prototype.removeTrack = function (view) {
            this.map["delete"](view.model);
            this.rotary.removeTrack(view.model);
            view.element.remove();
            view.terminate();
        };
        RotaryView.prototype.updateOrder = function () {
            var _this = this;
            common_5.Dom.emptyElement(this.tracksContainer);
            this.rotary.tracks.forEach(function (track) { return _this.tracksContainer.appendChild(_this.map.get(track).element); });
        };
        return RotaryView;
    }());
    exports.RotaryView = RotaryView;
    var RotaryTrackView = (function () {
        function RotaryTrackView(view, element, model) {
            var _this = this;
            this.view = view;
            this.element = element;
            this.model = model;
            this.terminator = new common_4.Terminator();
            this.segments = this.terminator["with"](new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-parameter='segments']"), model.segments, common_4.PrintMapping.NoFloat, common_4.NumericStepper.Integer, ""));
            this.width = this.terminator["with"](new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-parameter='width']"), model.width, common_4.PrintMapping.NoFloat, common_4.NumericStepper.Integer, "px"));
            this.widthPadding = this.terminator["with"](new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-parameter='width-padding']"), model.widthPadding, common_4.PrintMapping.NoFloat, common_4.NumericStepper.Integer, "px"));
            this.length = this.terminator["with"](new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-parameter='length']"), model.length, common_4.PrintMapping.UnipolarPercent, common_4.NumericStepper.FloatPercent, "%"));
            this.lengthRatio = this.terminator["with"](new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-parameter='length-ratio']"), model.lengthRatio, common_4.PrintMapping.UnipolarPercent, common_4.NumericStepper.FloatPercent, "%"));
            this.phase = this.terminator["with"](new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-parameter='phase']"), model.phase, common_4.PrintMapping.UnipolarPercent, common_4.NumericStepper.FloatPercent, "%"));
            this.fill = this.terminator["with"](new inputs_1.SelectInput(element.querySelector("select[data-parameter='fill']"), model_1.Fills, model.fill));
            this.movement = this.terminator["with"](new inputs_1.SelectInput(element.querySelector("select[data-parameter='movement']"), model_1.Movements, model.movement));
            this.reverse = this.terminator["with"](new inputs_1.Checkbox(element.querySelector("input[data-parameter='reverse']"), model.reverse));
            var removeButton = element.querySelector("button[data-action='remove']");
            removeButton.onclick = function () { return view.removeTrack(_this); };
            var newButton = element.querySelector("button[data-action='new']");
            newButton.onclick = function () { return view.newTrackAfter(_this); };
            var copyButton = element.querySelector("button[data-action='copy']");
            copyButton.onclick = function () { return view.copyTrack(_this); };
        }
        RotaryTrackView.prototype.draw = function (context, radiusMin, position) {
            var segments = this.model.segments.get();
            var scale = this.model.length.get() / segments;
            var phase = this.model.movement.get()(position - Math.floor(position)) * (this.model.reverse.get() ? -1 : 1) + this.model.phase.get();
            var width = this.model.width.get();
            var widthPadding = this.model.widthPadding.get();
            var r0 = radiusMin + widthPadding;
            var r1 = radiusMin + widthPadding + width;
            for (var i = 0; i < segments; i++) {
                var angleMin = i * scale + phase;
                var angleMax = angleMin + scale * this.model.lengthRatio.get();
                this.drawSection(context, r0, r1, angleMin, angleMax, this.model.fill.get());
            }
        };
        RotaryTrackView.prototype.drawSection = function (context, radiusMin, radiusMax, angleMin, angleMax, fill) {
            if (fill === void 0) { fill = model_1.Fill.Flat; }
            console.assert(radiusMin < radiusMax, "radiusMax(" + radiusMax + ") must be greater then radiusMin(" + radiusMin + ")");
            console.assert(angleMin < angleMax, "angleMax(" + angleMax + ") must be greater then angleMin(" + angleMin + ")");
            var radianMin = angleMin * common_4.TAU;
            var radianMax = angleMax * common_4.TAU;
            if (fill === model_1.Fill.Flat) {
                context.fillStyle = this.model.opaque();
            }
            else if (fill === model_1.Fill.Stroke) {
                context.strokeStyle = this.model.opaque();
            }
            else {
                var gradient = context.createConicGradient(radianMin, 0.0, 0.0);
                var offset = Math.min(angleMax - angleMin, 1.0);
                if (fill === model_1.Fill.Positive) {
                    gradient.addColorStop(0.0, this.model.transparent());
                    gradient.addColorStop(offset, this.model.opaque());
                    gradient.addColorStop(offset, this.model.transparent());
                }
                else if (fill === model_1.Fill.Negative) {
                    gradient.addColorStop(0.0, this.model.opaque());
                    gradient.addColorStop(offset, this.model.transparent());
                }
                context.fillStyle = gradient;
            }
            context.beginPath();
            context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false);
            context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true);
            context.closePath();
            if (fill === model_1.Fill.Stroke) {
                context.stroke();
            }
            else {
                context.fill();
            }
        };
        RotaryTrackView.prototype.terminate = function () {
            this.terminator.terminate();
        };
        RotaryTrackView.WHITE = "white";
        RotaryTrackView.TRANSPARENT = "rgba(255, 255, 255, 0.0)";
        return RotaryTrackView;
    }());
    exports.RotaryTrackView = RotaryTrackView;
});
define("main", ["require", "exports", "rotary/model", "rotary/view"], function (require, exports, model_2, view_1) {
    "use strict";
    exports.__esModule = true;
    var rotary = new model_2.RotaryModel();
    var rotaryView = view_1.RotaryView.create(document, rotary);
    var frame = 0;
    (function () {
        console.log("ready...");
        var canvas = document.querySelector("canvas");
        var labelSize = document.querySelector("label.size");
        var context = canvas.getContext("2d", { alpha: true });
        var enterFrame = function () {
            var size = rotary.measureRadius() * 2;
            var ratio = Math.ceil(devicePixelRatio);
            canvas.width = size * ratio;
            canvas.height = size * ratio;
            canvas.style.width = size + "px";
            canvas.style.height = size + "px";
            labelSize.textContent = "" + size;
            context.clearRect(0.0, 0.0, size, size);
            context.save();
            context.scale(ratio, ratio);
            context.translate(size >> 1, size >> 1);
            rotaryView.draw(context, frame / 320.0);
            context.restore();
            frame++;
            requestAnimationFrame(enterFrame);
        };
        enterFrame();
    })();
});
//# sourceMappingURL=main.js.map