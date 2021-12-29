define("lib/common", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.TAU = Math.PI * 2.0;
    var TerminableVoid = (function () {
        function TerminableVoid() {
        }
        TerminableVoid.prototype.terminate = function () {
        };
        TerminableVoid.Instance = new TerminableVoid();
        return TerminableVoid;
    }());
    exports.TerminableVoid = TerminableVoid;
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
        function PrintMapping(parser, printer, preUnit, postUnit) {
            if (preUnit === void 0) { preUnit = ""; }
            if (postUnit === void 0) { postUnit = ""; }
            this.parser = parser;
            this.printer = printer;
            this.preUnit = preUnit;
            this.postUnit = postUnit;
        }
        PrintMapping.integer = function (postUnit) {
            return new PrintMapping(function (text) {
                var value = parseInt(text, 10);
                if (isNaN(value))
                    return null;
                return value | 0;
            }, function (value) { return String(value); }, "", postUnit);
        };
        PrintMapping.prototype.parse = function (text) {
            return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
        };
        PrintMapping.prototype.print = function (value) {
            return undefined === value ? "" : "" + this.preUnit + this.printer(value) + this.postUnit;
        };
        PrintMapping.UnipolarPercent = new PrintMapping(function (text) {
            var value = parseFloat(text);
            if (isNaN(value))
                return null;
            return value / 100.0;
        }, function (value) { return (value * 100.0).toFixed(1); }, "", "%");
        PrintMapping.RGB = new PrintMapping(function (text) {
            if (3 === text.length) {
                text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
            }
            if (6 === text.length) {
                return parseInt(text, 16);
            }
            else {
                return null;
            }
        }, function (value) { return value.toString(16).padStart(6, "0").toUpperCase(); }, "#", "");
        return PrintMapping;
    }());
    exports.PrintMapping = PrintMapping;
    var ObservableValueVoid = (function () {
        function ObservableValueVoid() {
        }
        ObservableValueVoid.prototype.addObserver = function (observer) {
            return TerminableVoid.Instance;
        };
        ObservableValueVoid.prototype.get = function () {
            return undefined;
        };
        ObservableValueVoid.prototype.removeObserver = function (observer) {
            return false;
        };
        ObservableValueVoid.prototype.set = function (value) {
            return true;
        };
        ObservableValueVoid.prototype.terminate = function () {
        };
        ObservableValueVoid.Instance = new ObservableValueVoid();
        return ObservableValueVoid;
    }());
    exports.ObservableValueVoid = ObservableValueVoid;
    var ObservableValueImpl = (function () {
        function ObservableValueImpl(value) {
            this.value = value;
            this.observable = new ObservableImpl();
        }
        ObservableValueImpl.prototype.get = function () {
            return this.value;
        };
        ObservableValueImpl.prototype.set = function (value) {
            if (this.value === value) {
                return false;
            }
            this.value = value;
            this.observable.notify(this);
            return true;
        };
        ObservableValueImpl.prototype.addObserver = function (observer) {
            return this.observable.addObserver(observer);
        };
        ObservableValueImpl.prototype.removeObserver = function (observer) {
            return this.observable.removeObserver(observer);
        };
        ObservableValueImpl.prototype.terminate = function () {
            this.observable.terminate();
        };
        return ObservableValueImpl;
    }());
    exports.ObservableValueImpl = ObservableValueImpl;
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
                var model = new RotaryTrackModel();
                model.randomize();
                this.tracks.push(model);
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
            copy.rgb.set(source.rgb.get());
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
                return true;
            }
            return false;
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
        Fill[Fill["Line"] = 2] = "Line";
        Fill[Fill["Positive"] = 3] = "Positive";
        Fill[Fill["Negative"] = 4] = "Negative";
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
    exports.Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]]);
    var RotaryTrackModel = (function () {
        function RotaryTrackModel() {
            var _this = this;
            this.terminator = new common_1.Terminator();
            this.gradient = [];
            this.segments = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(1, 128), 8));
            this.width = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(1, 128), 12));
            this.widthPadding = this.terminator["with"](new common_1.Parameter(new common_1.LinearInteger(0, 128), 0));
            this.length = this.terminator["with"](new common_1.Parameter(common_1.Linear.Identity, 1.0));
            this.lengthRatio = this.terminator["with"](new common_1.Parameter(common_1.Linear.Identity, 0.5));
            this.phase = this.terminator["with"](new common_1.Parameter(common_1.Linear.Identity, 0.0));
            this.fill = this.terminator["with"](new common_1.ObservableValueImpl(Fill.Flat));
            this.movement = this.terminator["with"](new common_1.ObservableValueImpl(exports.Movements.values().next().value));
            this.reverse = this.terminator["with"](new common_1.ObservableValueImpl(false));
            this.rgb = this.terminator["with"](new common_1.ObservableValueImpl((0xFFFFFF)));
            this.terminator["with"](this.rgb.addObserver(function () { return _this.updateGradient(); }));
            this.updateGradient();
        }
        RotaryTrackModel.prototype.opaque = function () {
            return this.gradient[0];
        };
        RotaryTrackModel.prototype.transparent = function () {
            return this.gradient[1];
        };
        RotaryTrackModel.prototype.randomize = function () {
            var segments = 1 + Math.floor(Math.random() * 9);
            var lengthRatioExp = -Math.floor(Math.random() * 3);
            var lengthRatio = 0 === lengthRatioExp ? 1.0 : Math.random() < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp);
            var width = Math.random() < 0.1 ? 24.0 : 12.0;
            var widthPadding = Math.random() < 0.1 ? 0.0 : 3.0;
            var length = Math.random() < 0.1 ? 0.75 : 1.0;
            var fill = 2 === segments ? Fill.Positive : Math.random() < 0.2 ? Fill.Stroke : Fill.Flat;
            this.segments.set(0 === lengthRatioExp ? 1 : segments);
            this.width.set(width);
            this.widthPadding.set(widthPadding);
            this.length.set(length);
            this.lengthRatio.set(lengthRatio);
            this.fill.set(fill);
            this.movement.set(exports.randomMovement());
        };
        RotaryTrackModel.prototype.terminate = function () {
            this.terminator.terminate();
        };
        RotaryTrackModel.prototype.updateGradient = function () {
            var rgb = this.rgb.get();
            var r = (rgb >> 16) & 0xFF;
            var g = (rgb >> 8) & 0xFF;
            var b = rgb & 0xFF;
            this.gradient[0] = "rgba(" + r + "," + g + "," + b + ",1.0)";
            this.gradient[1] = "rgba(" + r + "," + g + "," + b + ",0.0)";
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
        Dom.emptyNode = function (node) {
            while (node.hasChildNodes()) {
                node.lastChild.remove();
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
        function Checkbox(element) {
            var _this = this;
            this.element = element;
            this.terminator = new common_3.Terminator();
            this.observer = function () { return _this.update(); };
            this.value = common_3.ObservableValueVoid.Instance;
            this.init();
        }
        Checkbox.prototype.withValue = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
            return this;
        };
        Checkbox.prototype.init = function () {
            var _this = this;
            this.terminator["with"](common_2.Dom.bindEventListener(this.element, "change", function () { return _this.value.set(_this.element.checked); }));
        };
        Checkbox.prototype.update = function () {
            this.element.checked = this.value.get();
        };
        Checkbox.prototype.terminate = function () {
            this.value.removeObserver(this.observer);
            this.terminator.terminate();
        };
        return Checkbox;
    }());
    exports.Checkbox = Checkbox;
    var SelectInput = (function () {
        function SelectInput(select, map) {
            var _this = this;
            this.select = select;
            this.map = map;
            this.terminator = new common_3.Terminator();
            this.value = common_3.ObservableValueVoid.Instance;
            this.observer = function () { return _this.update(); };
            this.options = new Map();
            this.values = [];
            this.connect();
        }
        SelectInput.prototype.withValue = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
            return this;
        };
        SelectInput.prototype.terminate = function () {
            this.value.removeObserver(this.observer);
            this.terminator.terminate();
        };
        SelectInput.prototype.update = function () {
            var key = this.value.get();
            if (key === undefined)
                return;
            this.options.get(key).selected = true;
        };
        SelectInput.prototype.connect = function () {
            var _this = this;
            this.map.forEach(function (some, key) {
                var optionElement = document.createElement("OPTION");
                optionElement.textContent = key;
                optionElement.selected = some === _this.value.get();
                _this.select.appendChild(optionElement);
                _this.values.push(some);
                _this.options.set(some, optionElement);
            });
            this.terminator["with"](common_2.Dom.bindEventListener(this.select, "change", function () { return _this.value.set(_this.values[_this.select.selectedIndex]); }));
        };
        return SelectInput;
    }());
    exports.SelectInput = SelectInput;
    var NumericStepperInput = (function () {
        function NumericStepperInput(parent, printMapping, stepper) {
            var _this = this;
            this.parent = parent;
            this.printMapping = printMapping;
            this.stepper = stepper;
            this.terminator = new common_3.Terminator();
            this.observer = function () { return _this.update(); };
            this.value = common_3.ObservableValueVoid.Instance;
            var buttons = this.parent.querySelectorAll("button");
            this.decreaseButton = buttons.item(0);
            this.increaseButton = buttons.item(1);
            this.input = this.parent.querySelector("input[type=text]");
            this.connect();
        }
        NumericStepperInput.prototype.withValue = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
            return this;
        };
        NumericStepperInput.prototype.connect = function () {
            var _this = this;
            this.terminator["with"](common_2.Dom.configRepeatButton(this.decreaseButton, function () { return _this.stepper.decrease(_this.value); }));
            this.terminator["with"](common_2.Dom.configRepeatButton(this.increaseButton, function () { return _this.stepper.increase(_this.value); }));
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
                            _this.stepper.increase(_this.value);
                            _this.input.select();
                            break;
                        }
                        case "ArrowDown": {
                            event.preventDefault();
                            _this.stepper.decrease(_this.value);
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
                            if (null === number || !_this.value.set(number)) {
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
            return this.printMapping.parse(this.input.value);
        };
        NumericStepperInput.prototype.update = function () {
            this.input.value = this.printMapping.print(this.value.get());
        };
        NumericStepperInput.prototype.terminate = function () {
            this.terminator.terminate();
            this.value.removeObserver(this.observer);
        };
        return NumericStepperInput;
    }());
    exports.NumericStepperInput = NumericStepperInput;
    var NumericInput = (function () {
        function NumericInput(input, printMapping) {
            var _this = this;
            this.input = input;
            this.printMapping = printMapping;
            this.terminator = new common_3.Terminator();
            this.observer = function () { return _this.update(); };
            this.value = common_3.ObservableValueVoid.Instance;
            this.connect();
        }
        NumericInput.prototype.withValue = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
            return this;
        };
        NumericInput.prototype.connect = function () {
            var _this = this;
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
                        case "Escape": {
                            event.preventDefault();
                            _this.update();
                            blur();
                            break;
                        }
                        case "Enter": {
                            event.preventDefault();
                            var number = _this.parse();
                            if (null === number || !_this.value.set(number)) {
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
        NumericInput.prototype.parse = function () {
            return this.printMapping.parse(this.input.value);
        };
        NumericInput.prototype.update = function () {
            this.input.value = this.printMapping.print(this.value.get());
        };
        NumericInput.prototype.terminate = function () {
            this.terminator.terminate();
            this.value.removeObserver(this.observer);
        };
        return NumericInput;
    }());
    exports.NumericInput = NumericInput;
});
define("rotary/editor", ["require", "exports", "lib/common", "dom/inputs", "rotary/model", "dom/common"], function (require, exports, common_4, inputs_1, model_1, common_5) {
    "use strict";
    exports.__esModule = true;
    var RotaryTrackEditor = (function () {
        function RotaryTrackEditor(executor, parentNode) {
            var _this = this;
            this.executor = executor;
            this.terminator = new common_4.Terminator();
            this.subject = null;
            this.segments = this.terminator["with"](new inputs_1.NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='segments']"), common_4.PrintMapping.integer(""), common_4.NumericStepper.Integer));
            this.width = this.terminator["with"](new inputs_1.NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='width']"), common_4.PrintMapping.integer("px"), common_4.NumericStepper.Integer));
            this.widthPadding = this.terminator["with"](new inputs_1.NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='width-padding']"), common_4.PrintMapping.integer("px"), common_4.NumericStepper.Integer));
            this.length = this.terminator["with"](new inputs_1.NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='length']"), common_4.PrintMapping.UnipolarPercent, common_4.NumericStepper.FloatPercent));
            this.lengthRatio = this.terminator["with"](new inputs_1.NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='length-ratio']"), common_4.PrintMapping.UnipolarPercent, common_4.NumericStepper.FloatPercent));
            this.phase = this.terminator["with"](new inputs_1.NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='phase']"), common_4.PrintMapping.UnipolarPercent, common_4.NumericStepper.FloatPercent));
            this.fill = this.terminator["with"](new inputs_1.SelectInput(parentNode.querySelector("select[data-parameter='fill']"), model_1.Fills));
            this.movement = this.terminator["with"](new inputs_1.SelectInput(parentNode.querySelector("select[data-parameter='movement']"), model_1.Movements));
            this.reverse = this.terminator["with"](new inputs_1.Checkbox(parentNode.querySelector("input[data-parameter='reverse']")));
            this.rgb = this.terminator["with"](new inputs_1.NumericInput(parentNode.querySelector("input[data-parameter='rgb']"), common_4.PrintMapping.RGB));
            this.terminator["with"](common_5.Dom.bindEventListener(parentNode.querySelector("button.delete"), "click", function (event) {
                event.preventDefault();
                executor["delete"](_this.subject);
            }));
        }
        RotaryTrackEditor.prototype.edit = function (model) {
            this.segments.withValue(model.segments);
            this.width.withValue(model.width);
            this.widthPadding.withValue(model.widthPadding);
            this.length.withValue(model.length);
            this.lengthRatio.withValue(model.lengthRatio);
            this.phase.withValue(model.phase);
            this.fill.withValue(model.fill);
            this.rgb.withValue(model.rgb);
            this.movement.withValue(model.movement);
            this.reverse.withValue(model.reverse);
            this.subject = model;
        };
        RotaryTrackEditor.prototype.clear = function () {
            this.segments.withValue(common_4.ObservableValueVoid.Instance);
            this.width.withValue(common_4.ObservableValueVoid.Instance);
            this.widthPadding.withValue(common_4.ObservableValueVoid.Instance);
            this.length.withValue(common_4.ObservableValueVoid.Instance);
            this.lengthRatio.withValue(common_4.ObservableValueVoid.Instance);
            this.phase.withValue(common_4.ObservableValueVoid.Instance);
            this.fill.withValue(common_4.ObservableValueVoid.Instance);
            this.rgb.withValue(common_4.ObservableValueVoid.Instance);
            this.movement.withValue(common_4.ObservableValueVoid.Instance);
            this.reverse.withValue(common_4.ObservableValueVoid.Instance);
            this.subject = null;
        };
        RotaryTrackEditor.prototype.terminate = function () {
            this.terminator.terminate();
        };
        return RotaryTrackEditor;
    }());
    exports.RotaryTrackEditor = RotaryTrackEditor;
});
define("rotary/view", ["require", "exports", "lib/common", "dom/inputs", "rotary/editor", "dom/common"], function (require, exports, common_6, inputs_2, editor_1, common_7) {
    "use strict";
    exports.__esModule = true;
    var RotaryTrackSelector = (function () {
        function RotaryTrackSelector(selector, model, element, radio, button) {
            var _this = this;
            this.selector = selector;
            this.model = model;
            this.element = element;
            this.radio = radio;
            this.button = button;
            this.terminator = new common_6.Terminator();
            this.terminator["with"](common_7.Dom.bindEventListener(this.radio, "change", function () { return _this.selector.select(_this.model); }));
            this.terminator["with"](common_7.Dom.bindEventListener(this.button, "click", function (event) {
                event.preventDefault();
                _this.selector.createNew(_this.model, event.shiftKey);
            }));
        }
        RotaryTrackSelector.prototype.terminate = function () {
            this.element.remove();
            this.terminator.terminate();
        };
        return RotaryTrackSelector;
    }());
    var RotarySelector = (function () {
        function RotarySelector(form, selectors, template, model) {
            var _this = this;
            this.form = form;
            this.selectors = selectors;
            this.template = template;
            this.model = model;
            this.terminator = new common_6.Terminator();
            this.map = new Map();
            this.terminator["with"](new inputs_2.NumericStepperInput(document.querySelector("[data-parameter='start-radius']"), common_6.PrintMapping.integer("px"), new common_6.NumericStepper(1))).withValue(model.radiusMin);
            this.editor = new editor_1.RotaryTrackEditor(this, document);
            form.querySelector("#unshift-new-track").addEventListener("click", function (event) {
                event.preventDefault();
                var model = _this.model.createTrack(0);
                model.randomize();
                _this.createSelector(model);
                _this.updateOrder();
                _this.select(model);
            });
            model.tracks.forEach(function (track) { return _this.createSelector(track); });
            if (0 < model.tracks.length) {
                this.select(model.tracks[0]);
            }
            this.updateOrder();
        }
        RotarySelector.create = function (document, rotary) {
            var form = document.querySelector("form.track-nav");
            var selectors = form.querySelector("#track-selectors");
            var template = selectors.querySelector("#template-selector-track");
            template.remove();
            return new RotarySelector(form, selectors, template, rotary);
        };
        RotarySelector.prototype.createSelector = function (trackModel) {
            var element = this.template.cloneNode(true);
            var radio = element.querySelector("input[type=radio]");
            var button = element.querySelector("button");
            this.map.set(trackModel, new RotaryTrackSelector(this, trackModel, element, radio, button));
        };
        RotarySelector.prototype.select = function (model) {
            this.editor.edit(model);
            this.map.get(model).radio.checked = true;
        };
        RotarySelector.prototype.createNew = function (model, copy) {
            var index = this.model.tracks.indexOf(model);
            console.assert(-1 !== index, "could find model");
            var newModel = copy
                ? this.model.copyTrack(model, index + 1)
                : this.model.createTrack(index + 1);
            newModel.randomize();
            this.createSelector(newModel);
            this.updateOrder();
            this.select(newModel);
        };
        RotarySelector.prototype["delete"] = function (model) {
            var index = this.model.tracks.indexOf(model);
            this.map.get(model).terminate();
            this.map["delete"](model);
            this.model.removeTrack(model);
            this.updateOrder();
            var numTracks = this.model.tracks.length;
            if (0 < numTracks) {
                this.select(this.model.tracks[Math.min(index, numTracks - 1)]);
            }
            else {
                this.editor.clear();
            }
        };
        RotarySelector.prototype.updateOrder = function () {
            var _this = this;
            common_7.Dom.emptyNode(this.selectors);
            this.model.tracks.forEach(function (track) { return _this.selectors.appendChild(_this.map.get(track).element); });
        };
        return RotarySelector;
    }());
    exports.RotarySelector = RotarySelector;
});
define("rotary/render", ["require", "exports", "rotary/model", "lib/common"], function (require, exports, model_2, common_8) {
    "use strict";
    exports.__esModule = true;
    var RotaryRenderer = (function () {
        function RotaryRenderer() {
        }
        RotaryRenderer.draw = function (context, rotary, position) {
            var radiusMin = rotary.radiusMin.get();
            for (var i = 0; i < rotary.tracks.length; i++) {
                var model = rotary.tracks[i];
                RotaryRenderer.drawTrack(context, model, radiusMin, position);
                radiusMin += model.width.get() + model.widthPadding.get();
            }
        };
        RotaryRenderer.drawTrack = function (context, model, radiusMin, position) {
            var segments = model.segments.get();
            var scale = model.length.get() / segments;
            var phase = model.movement.get()(position - Math.floor(position)) * (model.reverse.get() ? -1 : 1) + model.phase.get();
            var width = model.width.get();
            var thickness = model.widthPadding.get() * 0.5;
            var r0 = radiusMin + thickness;
            var r1 = radiusMin + thickness + width;
            for (var i = 0; i < segments; i++) {
                var angleMin = i * scale + phase;
                var angleMax = angleMin + scale * model.lengthRatio.get();
                RotaryRenderer.drawSection(context, model, r0, r1, angleMin, angleMax, model.fill.get());
            }
        };
        RotaryRenderer.drawSection = function (context, model, radiusMin, radiusMax, angleMin, angleMax, fill) {
            if (fill === void 0) { fill = model_2.Fill.Flat; }
            console.assert(radiusMin < radiusMax, "radiusMax(" + radiusMax + ") must be greater then radiusMin(" + radiusMin + ")");
            console.assert(angleMin < angleMax, "angleMax(" + angleMax + ") must be greater then angleMin(" + angleMin + ")");
            var radianMin = angleMin * common_8.TAU;
            var radianMax = angleMax * common_8.TAU;
            if (fill === model_2.Fill.Flat) {
                context.fillStyle = model.opaque();
            }
            else if (fill === model_2.Fill.Stroke || fill === model_2.Fill.Line) {
                context.strokeStyle = model.opaque();
            }
            else {
                var gradient = context.createConicGradient(radianMin, 0.0, 0.0);
                var offset = Math.min(angleMax - angleMin, 1.0);
                if (fill === model_2.Fill.Positive) {
                    gradient.addColorStop(0.0, model.transparent());
                    gradient.addColorStop(offset, model.opaque());
                    gradient.addColorStop(offset, model.transparent());
                }
                else if (fill === model_2.Fill.Negative) {
                    gradient.addColorStop(0.0, model.opaque());
                    gradient.addColorStop(offset, model.transparent());
                }
                context.fillStyle = gradient;
            }
            if (fill === model_2.Fill.Line) {
                var sn = Math.sin(radianMin);
                var cs = Math.cos(radianMin);
                context.beginPath();
                context.moveTo(cs * radiusMin, sn * radiusMin);
                context.lineTo(cs * radiusMax, sn * radiusMax);
                context.closePath();
            }
            else {
                context.beginPath();
                context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false);
                context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true);
                context.closePath();
            }
            if (fill === model_2.Fill.Stroke || fill === model_2.Fill.Line) {
                context.stroke();
            }
            else {
                context.fill();
            }
        };
        return RotaryRenderer;
    }());
    exports.RotaryRenderer = RotaryRenderer;
});
define("main", ["require", "exports", "rotary/model", "rotary/view", "rotary/render"], function (require, exports, model_3, view_1, render_1) {
    "use strict";
    exports.__esModule = true;
    var model = new model_3.RotaryModel();
    view_1.RotarySelector.create(document, model);
    var frame = 0;
    (function () {
        console.log("ready...");
        var canvas = document.querySelector("canvas");
        var labelSize = document.querySelector("label.size");
        var context = canvas.getContext("2d", { alpha: true });
        var enterFrame = function () {
            var size = model.measureRadius() * 2;
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
            render_1.RotaryRenderer.draw(context, model, frame / 320.0);
            context.restore();
            frame++;
            requestAnimationFrame(enterFrame);
        };
        enterFrame();
    })();
});
//# sourceMappingURL=main.js.map