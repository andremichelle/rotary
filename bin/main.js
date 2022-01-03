"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define("lib/math", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var JsRandom = (function () {
        function JsRandom() {
        }
        JsRandom.prototype.nextDouble = function (min, max) {
            return min + Math.random() * (max - min);
        };
        JsRandom.Instance = new JsRandom();
        return JsRandom;
    }());
    exports.JsRandom = JsRandom;
    var Mulberry32 = (function () {
        function Mulberry32(seed) {
            this.seed = seed;
        }
        Mulberry32.prototype.nextDouble = function (min, max) {
            return min + this.uniform() * (max - min);
        };
        Mulberry32.prototype.uniform = function () {
            var t = this.seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296.0;
        };
        return Mulberry32;
    }());
    exports.Mulberry32 = Mulberry32;
    var SmoothStep = (function () {
        function SmoothStep() {
        }
        SmoothStep.fx = function (x) {
            return x * x * (3.0 - 2.0 * x);
        };
        SmoothStep.edge = function (edge0, edge1, x) {
            console.assert(0.0 <= edge0 && 1.0 >= edge0, "edge0(" + edge0 + ") must be between 0 and 1");
            console.assert(0.0 <= edge1 && 1.0 >= edge1, "edge1(" + edge1 + ") must be between 0 and 1");
            console.assert(edge0 !== edge1, "edge0(" + edge0 + ") must not be equal to edge1(" + edge1 + ")");
            return SmoothStep.fx(Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0))));
        };
        return SmoothStep;
    }());
    exports.SmoothStep = SmoothStep;
});
define("lib/mapping", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var Range = (function () {
        function Range() {
        }
        Range.prototype.clamp = function (value) {
            return Math.min(this.max, Math.max(this.min, value));
        };
        return Range;
    }());
    exports.Range = Range;
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
});
define("lib/common", ["require", "exports", "lib/mapping"], function (require, exports, mapping_1) {
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
    var Options = (function () {
        function Options() {
        }
        Options.valueOf = function (value) {
            return null === value || undefined === value ? Options.None : new Options.Some(value);
        };
        Options.Some = (function () {
            function class_1(value) {
                var _this = this;
                this.value = value;
                this.get = function () { return _this.value; };
                this.contains = function (value) { return value === _this.value; };
                this.ifPresent = function (callback) { return callback(_this.value); };
                this.isEmpty = function () { return false; };
                this.nonEmpty = function () { return true; };
                console.assert(null !== value && undefined !== value, "Cannot be null or undefined");
            }
            class_1.prototype.toString = function () {
                return "Options.Some(" + this.value + ")";
            };
            return class_1;
        }());
        Options.None = new (function () {
            function class_2() {
                this.get = function () {
                    throw new Error("Option has no value");
                };
                this.contains = function (_) { return false; };
                this.ifPresent = function (_) {
                };
                this.isEmpty = function () { return true; };
                this.nonEmpty = function () { return false; };
            }
            class_2.prototype.toString = function () {
                return "Options.None";
            };
            return class_2;
        }());
        return Options;
    }());
    exports.Options = Options;
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
    var ObservableValueVoid = (function () {
        function ObservableValueVoid() {
        }
        ObservableValueVoid.prototype.addObserver = function (observer) {
            return TerminableVoid.Instance;
        };
        ObservableValueVoid.prototype.get = function () {
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
    var CollectionEventType;
    (function (CollectionEventType) {
        CollectionEventType[CollectionEventType["Add"] = 0] = "Add";
        CollectionEventType[CollectionEventType["Remove"] = 1] = "Remove";
        CollectionEventType[CollectionEventType["Order"] = 2] = "Order";
    })(CollectionEventType = exports.CollectionEventType || (exports.CollectionEventType = {}));
    var CollectionEvent = (function () {
        function CollectionEvent(collection, type, item, index) {
            if (item === void 0) { item = null; }
            if (index === void 0) { index = -1; }
            this.collection = collection;
            this.type = type;
            this.item = item;
            this.index = index;
        }
        return CollectionEvent;
    }());
    exports.CollectionEvent = CollectionEvent;
    var ObservableCollection = (function () {
        function ObservableCollection() {
            this.observable = new ObservableImpl();
            this.values = [];
        }
        ObservableCollection.prototype.add = function (value, index) {
            if (index === void 0) { index = Number.MAX_SAFE_INTEGER; }
            console.assert(0 <= index);
            index = Math.min(index, this.values.length);
            if (this.values.includes(value))
                return false;
            this.values.splice(index, 0, value);
            this.observable.notify(new CollectionEvent(this, CollectionEventType.Add, value, index));
            return true;
        };
        ObservableCollection.prototype.addAll = function (values) {
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var value = values_1[_i];
                this.add(value);
            }
        };
        ObservableCollection.prototype.remove = function (value) {
            return this.removeIndex(this.values.indexOf(value));
        };
        ObservableCollection.prototype.removeIndex = function (index) {
            if (-1 === index)
                return false;
            var removed = this.values.splice(index, 1);
            if (0 === removed.length)
                return false;
            this.observable.notify(new CollectionEvent(this, CollectionEventType.Remove, removed[0], index));
            return true;
        };
        ObservableCollection.prototype.clear = function () {
            for (var index = this.values.length - 1; index > -1; index--) {
                this.removeIndex(index);
            }
        };
        ObservableCollection.prototype.get = function (index) {
            return this.values[index];
        };
        ObservableCollection.prototype.indexOf = function (value) {
            return this.values.indexOf(value);
        };
        ObservableCollection.prototype.size = function () {
            return this.values.length;
        };
        ObservableCollection.prototype.map = function (fn) {
            var arr = [];
            for (var i = 0; i < this.values.length; i++) {
                arr[i] = fn(this.values[i], i, this.values);
            }
            return arr;
        };
        ObservableCollection.prototype.forEach = function (fn) {
            for (var i = 0; i < this.values.length; i++) {
                fn(this.values[i], i);
            }
        };
        ObservableCollection.prototype.reduce = function (fn, initialValue) {
            var value = initialValue;
            for (var i = 0; i < this.values.length; i++) {
                value = fn(value, this.values[i], i);
            }
            return value;
        };
        ObservableCollection.prototype.addObserver = function (observer) {
            return this.observable.addObserver(observer);
        };
        ObservableCollection.prototype.removeObserver = function (observer) {
            return this.observable.removeObserver(observer);
        };
        ObservableCollection.prototype.terminate = function () {
            this.observable.terminate();
        };
        return ObservableCollection;
    }());
    exports.ObservableCollection = ObservableCollection;
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
            this.observable.notify(value);
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
    var BoundNumericValue = (function () {
        function BoundNumericValue(range, value) {
            if (range === void 0) { range = mapping_1.Linear.Identity; }
            if (value === void 0) { value = 0.5; }
            this.range = range;
            this.value = value;
            this.observable = new ObservableImpl();
        }
        BoundNumericValue.prototype.get = function () {
            return this.value;
        };
        BoundNumericValue.prototype.set = function (value) {
            value = this.range.clamp(value);
            if (this.value === value) {
                return false;
            }
            this.value = value;
            this.observable.notify(value);
            return true;
        };
        BoundNumericValue.prototype.addObserver = function (observer) {
            return this.observable.addObserver(observer);
        };
        BoundNumericValue.prototype.removeObserver = function (observer) {
            return this.observable.removeObserver(observer);
        };
        BoundNumericValue.prototype.terminate = function () {
            this.observable.terminate();
        };
        return BoundNumericValue;
    }());
    exports.BoundNumericValue = BoundNumericValue;
    exports.binarySearch = function (values, key) {
        var low = 0 | 0;
        var high = (values.length - 1) | 0;
        while (low <= high) {
            var mid = (low + high) >>> 1;
            var midVal = values[mid];
            if (midVal < key)
                low = mid + 1;
            else if (midVal > key)
                high = mid - 1;
            else {
                if (midVal === key)
                    return mid;
                else if (midVal < key)
                    low = mid + 1;
                else
                    high = mid - 1;
            }
        }
        return high;
    };
    var UniformRandomMapping = (function () {
        function UniformRandomMapping(random, resolution, roughness, strength) {
            if (resolution === void 0) { resolution = 1024; }
            if (roughness === void 0) { roughness = 4.0; }
            if (strength === void 0) { strength = 0.2; }
            this.random = random;
            this.resolution = resolution;
            this.roughness = roughness;
            this.strength = strength;
            this.values = UniformRandomMapping.monotoneRandom(random, resolution, roughness, strength);
        }
        UniformRandomMapping.monotoneRandom = function (random, n, roughness, strength) {
            var sequence = new Float32Array(n + 1);
            var sum = 0.0;
            for (var i = 1; i <= n; ++i) {
                var x = Math.floor(random.nextDouble(0.0, roughness)) + 1.0;
                sum += x;
                sequence[i] = x;
            }
            var nominator = 0.0;
            for (var i = 1; i <= n; ++i) {
                nominator += sequence[i];
                sequence[i] = (nominator / sum) * strength + (1.0 - strength) * i / n;
            }
            return sequence;
        };
        UniformRandomMapping.prototype.clamp = function (y) {
            return Math.max(0.0, Math.min(1.0, y));
        };
        UniformRandomMapping.prototype.x = function (y) {
            if (y <= 0.0)
                return 0.0;
            if (y >= 1.0)
                return 1.0;
            var index = exports.binarySearch(this.values, y);
            var a = this.values[index];
            var b = this.values[index + 1];
            var nInverse = 1.0 / this.resolution;
            return index * nInverse + nInverse / (b - a) * (y - a);
        };
        UniformRandomMapping.prototype.y = function (x) {
            if (x <= 0.0)
                return 0.0;
            if (x >= 1.0)
                return 1.0;
            var xd = x * this.resolution;
            var xi = xd | 0;
            var a = xd - xi;
            var q = this.values[xi];
            return q + a * (this.values[xi + 1] - q);
        };
        return UniformRandomMapping;
    }());
    exports.UniformRandomMapping = UniformRandomMapping;
});
define("rotary/motion", ["require", "exports", "lib/common", "lib/mapping", "lib/math"], function (require, exports, common_1, mapping_2, math_1) {
    "use strict";
    exports.__esModule = true;
    var MotionTypes = [];
    var Motion = (function () {
        function Motion() {
            this.terminator = new common_1.Terminator();
        }
        Motion.from = function (format) {
            switch (format["class"]) {
                case PowMotion.name:
                    return new PowMotion().deserialize(format);
                case CShapeMotion.name:
                    return new CShapeMotion().deserialize(format);
                case SmoothStepMotion.name:
                    return new SmoothStepMotion().deserialize(format);
            }
            throw new Error("Unknown movement format");
        };
        Motion.random = function (random) {
            return new MotionTypes[Math.floor(random.nextDouble(0.0, MotionTypes.length))]().randomize(random);
        };
        Motion.prototype.pack = function (data) {
            return {
                "class": this.constructor.name,
                data: data
            };
        };
        Motion.prototype.unpack = function (format) {
            console.assert(this.constructor.name === format["class"]);
            return format.data;
        };
        Motion.prototype.terminate = function () {
            this.terminator.terminate();
        };
        return Motion;
    }());
    exports.Motion = Motion;
    var LinearMotion = (function (_super) {
        __extends(LinearMotion, _super);
        function LinearMotion() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LinearMotion.prototype.map = function (x) {
            return x;
        };
        LinearMotion.prototype.serialize = function () {
            return _super.prototype.pack.call(undefined);
        };
        LinearMotion.prototype.deserialize = function (format) {
            _super.prototype.unpack.call(this, format);
            return this;
        };
        LinearMotion.prototype.randomize = function (random) {
            return this;
        };
        return LinearMotion;
    }(Motion));
    exports.LinearMotion = LinearMotion;
    var PowMotion = (function (_super) {
        __extends(PowMotion, _super);
        function PowMotion() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.range = new mapping_2.Linear(1.0, 16.0);
            _this.exponent = _this.terminator["with"](new common_1.BoundNumericValue(_this.range, 2.0));
            return _this;
        }
        PowMotion.prototype.map = function (x) {
            return Math.pow(x, this.exponent.get());
        };
        PowMotion.prototype.serialize = function () {
            return _super.prototype.pack.call(this, { exponent: this.exponent.get() });
        };
        PowMotion.prototype.deserialize = function (format) {
            this.exponent.set(_super.prototype.unpack.call(this, format).exponent);
            return this;
        };
        PowMotion.prototype.randomize = function (random) {
            this.exponent.set(random.nextDouble(this.range.min, this.range.max));
            return this;
        };
        return PowMotion;
    }(Motion));
    exports.PowMotion = PowMotion;
    var CShapeMotion = (function (_super) {
        __extends(CShapeMotion, _super);
        function CShapeMotion() {
            var _this = _super.call(this) || this;
            _this.range = new mapping_2.Linear(0.0, 4.0);
            _this.shape = _this.terminator["with"](new common_1.BoundNumericValue(_this.range, 1.0));
            _this.terminator["with"](_this.shape.addObserver(function () { return _this.update(); }));
            _this.update();
            return _this;
        }
        CShapeMotion.prototype.map = function (x) {
            return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5;
        };
        CShapeMotion.prototype.serialize = function () {
            return _super.prototype.pack.call(this, { shape: this.shape.get() });
        };
        CShapeMotion.prototype.deserialize = function (format) {
            this.shape.set(_super.prototype.unpack.call(this, format).shape);
            return this;
        };
        CShapeMotion.prototype.randomize = function (random) {
            this.shape.set(random.nextDouble(this.range.min, this.range.max));
            return this;
        };
        CShapeMotion.prototype.update = function () {
            this.o = Math.pow(2.0, this.shape.get());
            this.c = Math.pow(2.0, this.o - 1);
        };
        return CShapeMotion;
    }(Motion));
    exports.CShapeMotion = CShapeMotion;
    var SmoothStepMotion = (function (_super) {
        __extends(SmoothStepMotion, _super);
        function SmoothStepMotion() {
            var _this = _super.call(this) || this;
            _this.edge0 = _this.terminator["with"](new common_1.BoundNumericValue(mapping_2.Linear.Identity, 0.25));
            _this.edge1 = _this.terminator["with"](new common_1.BoundNumericValue(mapping_2.Linear.Identity, 0.75));
            return _this;
        }
        SmoothStepMotion.prototype.map = function (x) {
            return math_1.SmoothStep.edge(this.edge0.get(), this.edge1.get(), x);
        };
        SmoothStepMotion.prototype.deserialize = function (format) {
            var data = this.unpack(format);
            this.edge0.set(data.edge0);
            this.edge1.set(data.edge1);
            return this;
        };
        SmoothStepMotion.prototype.serialize = function () {
            return _super.prototype.pack.call(this, { edge0: this.edge0.get(), edge1: this.edge1.get() });
        };
        SmoothStepMotion.prototype.randomize = function (random) {
            var limit = random.nextDouble(0.0, 1.0);
            this.edge0.set(limit);
            this.edge1.set(random.nextDouble(limit, 1.0));
            return this;
        };
        return SmoothStepMotion;
    }(Motion));
    exports.SmoothStepMotion = SmoothStepMotion;
    MotionTypes.push(LinearMotion);
    MotionTypes.push(PowMotion);
    MotionTypes.push(CShapeMotion);
    MotionTypes.push(SmoothStepMotion);
});
define("rotary/model", ["require", "exports", "lib/common", "lib/mapping", "rotary/motion"], function (require, exports, common_2, mapping_3, motion_1) {
    "use strict";
    exports.__esModule = true;
    var RotaryModel = (function () {
        function RotaryModel() {
            this.terminator = new common_2.Terminator();
            this.tracks = new common_2.ObservableCollection();
            this.radiusMin = this.terminator["with"](new common_2.BoundNumericValue(new mapping_3.LinearInteger(0, 1024), 20));
        }
        RotaryModel.prototype.randomize = function (random) {
            var tracks = [];
            var radius = this.radiusMin.get();
            while (radius < 256) {
                var track = new RotaryTrackModel().randomize(random);
                tracks.push(track);
                radius += track.width.get() + track.widthPadding.get();
            }
            this.tracks.clear();
            this.tracks.addAll(tracks);
            return this;
        };
        RotaryModel.prototype.randomizeTracks = function (random) {
            this.tracks.forEach(function (track) { return track.randomize(random); });
            return this;
        };
        RotaryModel.prototype.test = function () {
            var trackModel = new RotaryTrackModel();
            trackModel.motion.set(new motion_1.LinearMotion());
            this.tracks.clear();
            this.tracks.add(trackModel);
            return this;
        };
        RotaryModel.prototype.createTrack = function (index) {
            if (index === void 0) { index = Number.MAX_SAFE_INTEGER; }
            var track = new RotaryTrackModel();
            return this.tracks.add(track, index) ? track : null;
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
            copy.motion.set(source.motion.get());
            return copy;
        };
        RotaryModel.prototype.removeTrack = function (track) {
            return this.tracks.remove(track);
        };
        RotaryModel.prototype.clear = function () {
            this.radiusMin.set(20.0);
            this.tracks.clear();
        };
        RotaryModel.prototype.measureRadius = function () {
            return this.tracks.reduce(function (radius, track) {
                return radius + track.width.get() + track.widthPadding.get();
            }, this.radiusMin.get());
        };
        RotaryModel.prototype.terminate = function () {
            this.terminator.terminate();
        };
        RotaryModel.prototype.serialize = function () {
            return {
                radiusMin: this.radiusMin.get(),
                tracks: this.tracks.map(function (track) { return track.serialize(); })
            };
        };
        RotaryModel.prototype.deserialize = function (format) {
            this.radiusMin.set(format['radiusMin']);
            this.tracks.clear();
            this.tracks.addAll(format.tracks.map(function (trackFormat) {
                var model = new RotaryTrackModel();
                model.deserialize(trackFormat);
                return model;
            }));
            return this;
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
    exports.MotionTypes = new Map([
        ["Linear", motion_1.LinearMotion],
        ["Power", motion_1.PowMotion],
        ["CShape", motion_1.CShapeMotion],
        ["SmoothStep", motion_1.SmoothStepMotion]
    ]);
    exports.Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]]);
    var RotaryTrackModel = (function () {
        function RotaryTrackModel() {
            var _this = this;
            this.terminator = new common_2.Terminator();
            this.segments = this.terminator["with"](new common_2.BoundNumericValue(new mapping_3.LinearInteger(1, 1024), 8));
            this.width = this.terminator["with"](new common_2.BoundNumericValue(new mapping_3.LinearInteger(1, 1024), 12));
            this.widthPadding = this.terminator["with"](new common_2.BoundNumericValue(new mapping_3.LinearInteger(0, 1024), 0));
            this.length = this.terminator["with"](new common_2.BoundNumericValue(mapping_3.Linear.Identity, 1.0));
            this.lengthRatio = this.terminator["with"](new common_2.BoundNumericValue(mapping_3.Linear.Identity, 0.5));
            this.fill = this.terminator["with"](new common_2.ObservableValueImpl(Fill.Flat));
            this.rgb = this.terminator["with"](new common_2.ObservableValueImpl((0xFFFFFF)));
            this.motion = this.terminator["with"](new common_2.ObservableValueImpl(new motion_1.LinearMotion()));
            this.phaseOffset = this.terminator["with"](new common_2.BoundNumericValue(mapping_3.Linear.Identity, 0.0));
            this.frequency = this.terminator["with"](new common_2.BoundNumericValue(new mapping_3.LinearInteger(1, 16), 1.0));
            this.reverse = this.terminator["with"](new common_2.ObservableValueImpl(false));
            this.gradient = [];
            this.terminator["with"](this.rgb.addObserver(function () { return _this.updateGradient(); }));
            this.updateGradient();
        }
        RotaryTrackModel.prototype.map = function (phase) {
            var x = this.phaseOffset.get() + (phase - Math.floor(phase)) * (this.reverse.get() ? -1.0 : 1.0) * this.frequency.get();
            return this.motion.get().map(x - Math.floor(x));
        };
        RotaryTrackModel.prototype.opaque = function () {
            return this.gradient[0];
        };
        RotaryTrackModel.prototype.transparent = function () {
            return this.gradient[1];
        };
        RotaryTrackModel.prototype.randomize = function (random) {
            var segments = 1 + Math.floor(random.nextDouble(0.0, 9.0));
            var lengthRatioExp = -Math.floor(random.nextDouble(0.0, 3.0));
            var lengthRatio = 0 === lengthRatioExp ? 0.5 : random.nextDouble(0.0, 1.0) < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp);
            var width = random.nextDouble(0.0, 1.0) < 0.2 ? 20.0 : 12.0;
            var widthPadding = random.nextDouble(0.0, 1.0) < 0.25 ? 0.0 : 12.0;
            var length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0;
            var fill = 2 === segments ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat;
            this.segments.set(0 === lengthRatioExp ? 1 : segments);
            this.width.set(width);
            this.widthPadding.set(widthPadding);
            this.length.set(length);
            this.lengthRatio.set(lengthRatio);
            this.fill.set(fill);
            this.motion.set(motion_1.Motion.random(random));
            this.phaseOffset.set(random.nextDouble(0.0, 1.0));
            this.frequency.set(Math.floor(random.nextDouble(1.0, 4.0)));
            this.reverse.set(random.nextDouble(0.0, 1.0) < 0.5);
            return this;
        };
        RotaryTrackModel.prototype.terminate = function () {
            this.terminator.terminate();
        };
        RotaryTrackModel.prototype.serialize = function () {
            return {
                segments: this.segments.get(),
                width: this.width.get(),
                widthPadding: this.widthPadding.get(),
                length: this.length.get(),
                lengthRatio: this.lengthRatio.get(),
                fill: this.fill.get(),
                rgb: this.rgb.get(),
                motion: this.motion.get().serialize(),
                phaseOffset: this.phaseOffset.get(),
                frequency: this.frequency.get(),
                reverse: this.reverse.get()
            };
        };
        RotaryTrackModel.prototype.deserialize = function (format) {
            this.segments.set(format.segments);
            this.width.set(format.width);
            this.widthPadding.set(format.widthPadding);
            this.length.set(format.length);
            this.lengthRatio.set(format.lengthRatio);
            this.fill.set(format.fill);
            this.rgb.set(format.rgb);
            this.motion.set(motion_1.Motion.from(format.motion));
            this.phaseOffset.set(format.phaseOffset);
            this.frequency.set(format.frequency);
            this.reverse.set(format.reverse);
            return this;
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
define("dom/inputs", ["require", "exports", "dom/common", "lib/common"], function (require, exports, common_3, common_4) {
    "use strict";
    exports.__esModule = true;
    var Checkbox = (function () {
        function Checkbox(element) {
            var _this = this;
            this.element = element;
            this.terminator = new common_4.Terminator();
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = function () { return _this.update(); };
            this.init();
        }
        Checkbox.prototype["with"] = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        };
        Checkbox.prototype.clear = function () {
            this["with"](common_4.ObservableValueVoid.Instance);
        };
        Checkbox.prototype.init = function () {
            var _this = this;
            this.terminator["with"](common_3.Dom.bindEventListener(this.element, "change", function () { return _this.value.set(_this.element.checked); }));
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
            this.terminator = new common_4.Terminator();
            this.options = new Map();
            this.values = [];
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = function () { return _this.update(); };
            this.connect();
        }
        SelectInput.prototype["with"] = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        };
        SelectInput.prototype.clear = function () {
            this["with"](common_4.ObservableValueVoid.Instance);
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
            this.terminator["with"](common_3.Dom.bindEventListener(this.select, "change", function () { return _this.value.set(_this.values[_this.select.selectedIndex]); }));
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
            this.terminator = new common_4.Terminator();
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = function () { return _this.update(); };
            var buttons = this.parent.querySelectorAll("button");
            this.decreaseButton = buttons.item(0);
            this.increaseButton = buttons.item(1);
            this.input = this.parent.querySelector("input[type=text]");
            this.connect();
        }
        NumericStepperInput.prototype["with"] = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        };
        NumericStepperInput.prototype.clear = function () {
            this["with"](common_4.ObservableValueVoid.Instance);
        };
        NumericStepperInput.prototype.connect = function () {
            var _this = this;
            this.terminator["with"](common_3.Dom.configRepeatButton(this.decreaseButton, function () { return _this.stepper.decrease(_this.value); }));
            this.terminator["with"](common_3.Dom.configRepeatButton(this.increaseButton, function () { return _this.stepper.increase(_this.value); }));
            this.terminator["with"](common_3.Dom.bindEventListener(this.input, "focusin", function (focusEvent) {
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
            this.terminator = new common_4.Terminator();
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = function () { return _this.update(); };
            this.connect();
        }
        NumericInput.prototype["with"] = function (value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        };
        NumericInput.prototype.clear = function () {
            this["with"](common_4.ObservableValueVoid.Instance);
        };
        NumericInput.prototype.connect = function () {
            var _this = this;
            this.terminator["with"](common_3.Dom.bindEventListener(this.input, "focusin", function (focusEvent) {
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
define("rotary/editor", ["require", "exports", "lib/common", "dom/inputs", "rotary/model", "dom/common", "lib/mapping", "rotary/motion"], function (require, exports, common_5, inputs_1, model_1, common_6, mapping_4, motion_2) {
    "use strict";
    exports.__esModule = true;
    var PowMotionEditor = (function () {
        function PowMotionEditor(element) {
            this.input = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='pow'][data-parameter='exponent']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent);
        }
        PowMotionEditor.prototype["with"] = function (value) {
            this.input["with"](value.exponent);
        };
        PowMotionEditor.prototype.clear = function () {
            this.input["with"](common_5.ObservableValueVoid.Instance);
        };
        PowMotionEditor.prototype.terminate = function () {
            this.input.terminate();
        };
        return PowMotionEditor;
    }());
    exports.PowMotionEditor = PowMotionEditor;
    var CShapeMotionEditor = (function () {
        function CShapeMotionEditor(element) {
            this.input = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='cshape'][data-parameter='shape']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent);
        }
        CShapeMotionEditor.prototype["with"] = function (value) {
            this.input["with"](value.shape);
        };
        CShapeMotionEditor.prototype.clear = function () {
            this.input["with"](common_5.ObservableValueVoid.Instance);
        };
        CShapeMotionEditor.prototype.terminate = function () {
            this.input.terminate();
        };
        return CShapeMotionEditor;
    }());
    exports.CShapeMotionEditor = CShapeMotionEditor;
    var SmoothStepMotionEditor = (function () {
        function SmoothStepMotionEditor(element) {
            this.input0 = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='smoothstep'][data-parameter='edge0']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent);
            this.input1 = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='smoothstep'][data-parameter='edge1']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent);
        }
        SmoothStepMotionEditor.prototype["with"] = function (value) {
            this.input0["with"](value.edge0);
            this.input1["with"](value.edge1);
        };
        SmoothStepMotionEditor.prototype.clear = function () {
            this.input0["with"](common_5.ObservableValueVoid.Instance);
            this.input1["with"](common_5.ObservableValueVoid.Instance);
        };
        SmoothStepMotionEditor.prototype.terminate = function () {
            this.input0.terminate();
            this.input1.terminate();
        };
        return SmoothStepMotionEditor;
    }());
    exports.SmoothStepMotionEditor = SmoothStepMotionEditor;
    var MotionEditor = (function () {
        function MotionEditor(editor, element) {
            var _this = this;
            this.editor = editor;
            this.element = element;
            this.terminator = new common_5.Terminator();
            this.motionTypeValue = this.terminator["with"](new common_5.ObservableValueImpl(model_1.MotionTypes[0]));
            this.editable = common_5.Options.None;
            this.subscription = common_5.Options.None;
            this.typeSelectInput = this.terminator["with"](new inputs_1.SelectInput(element.querySelector("select[data-parameter='motion']"), model_1.MotionTypes));
            this.typeSelectInput["with"](this.motionTypeValue);
            this.powMotionEditor = this.terminator["with"](new PowMotionEditor(element));
            this.cShapeMotionEditor = this.terminator["with"](new CShapeMotionEditor(element));
            this.smoothStepMotionEditor = this.terminator["with"](new SmoothStepMotionEditor(element));
            this.terminator["with"](this.motionTypeValue.addObserver(function (motionType) { return _this.editable.ifPresent(function (value) { return value.set(new motionType()); }); }));
        }
        MotionEditor.prototype["with"] = function (value) {
            var _this = this;
            this.subscription.ifPresent(function (_) { return _.terminate(); });
            this.subscription = common_5.Options.None;
            this.editable = common_5.Options.valueOf(value);
            this.subscription = common_5.Options.valueOf(value.addObserver(function (value) { return _this.updateMotionType(value); }));
            this.updateMotionType(value.get());
        };
        MotionEditor.prototype.clear = function () {
            this.subscription.ifPresent(function (_) { return _.terminate(); });
            this.subscription = common_5.Options.None;
            this.editable = common_5.Options.None;
        };
        MotionEditor.prototype.terminate = function () {
            this.terminator.terminate();
        };
        MotionEditor.prototype.updateMotionType = function (motion) {
            var motionType = motion.constructor;
            console.log("updateMotionType: " + motionType.name);
            this.motionTypeValue.set(motionType);
            if (motion instanceof motion_2.LinearMotion) {
                this.element.setAttribute("data-motion", "linear");
                this.powMotionEditor.clear();
                this.cShapeMotionEditor.clear();
                this.smoothStepMotionEditor.clear();
            }
            else if (motion instanceof motion_2.PowMotion) {
                this.element.setAttribute("data-motion", "pow");
                this.powMotionEditor["with"](motion);
                this.cShapeMotionEditor.clear();
                this.smoothStepMotionEditor.clear();
            }
            else if (motion instanceof motion_2.CShapeMotion) {
                this.element.setAttribute("data-motion", "cshape");
                this.powMotionEditor.clear();
                this.cShapeMotionEditor["with"](motion);
                this.smoothStepMotionEditor.clear();
            }
            else if (motion instanceof motion_2.SmoothStepMotion) {
                this.element.setAttribute("data-motion", "smoothstep");
                this.powMotionEditor.clear();
                this.cShapeMotionEditor.clear();
                this.smoothStepMotionEditor["with"](motion);
            }
            else {
                this.element.removeAttribute("data-motion");
            }
        };
        return MotionEditor;
    }());
    exports.MotionEditor = MotionEditor;
    var RotaryTrackEditor = (function () {
        function RotaryTrackEditor(executor, document) {
            var _this = this;
            this.executor = executor;
            this.terminator = new common_5.Terminator();
            this.subject = common_5.Options.None;
            this.segments = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='segments']"), mapping_4.PrintMapping.integer(""), common_5.NumericStepper.Integer));
            this.width = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='width']"), mapping_4.PrintMapping.integer("px"), common_5.NumericStepper.Integer));
            this.widthPadding = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='width-padding']"), mapping_4.PrintMapping.integer("px"), common_5.NumericStepper.Integer));
            this.length = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='length']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent));
            this.lengthRatio = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='length-ratio']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent));
            this.fill = this.terminator["with"](new inputs_1.SelectInput(document.querySelector("select[data-parameter='fill']"), model_1.Fills));
            this.rgb = this.terminator["with"](new inputs_1.NumericInput(document.querySelector("input[data-parameter='rgb']"), mapping_4.PrintMapping.RGB));
            this.motion = new MotionEditor(this, document.querySelector(".track-editor"));
            this.phaseOffset = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='phase-offset']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.FloatPercent));
            this.frequency = this.terminator["with"](new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='frequency']"), mapping_4.PrintMapping.integer("x"), common_5.NumericStepper.Integer));
            this.reverse = this.terminator["with"](new inputs_1.Checkbox(document.querySelector("input[data-parameter='reverse']")));
            this.terminator["with"](common_6.Dom.bindEventListener(document.querySelector("button.delete"), "click", function (event) {
                event.preventDefault();
                _this.subject.ifPresent(function () { return executor.deleteTrack(); });
            }));
        }
        RotaryTrackEditor.prototype.edit = function (model) {
            this.segments["with"](model.segments);
            this.width["with"](model.width);
            this.widthPadding["with"](model.widthPadding);
            this.length["with"](model.length);
            this.lengthRatio["with"](model.lengthRatio);
            this.fill["with"](model.fill);
            this.rgb["with"](model.rgb);
            this.motion["with"](model.motion);
            this.phaseOffset["with"](model.phaseOffset);
            this.frequency["with"](model.frequency);
            this.reverse["with"](model.reverse);
            this.subject = common_5.Options.valueOf(model);
        };
        RotaryTrackEditor.prototype.clear = function () {
            this.subject = common_5.Options.None;
            this.segments.clear();
            this.width.clear();
            this.widthPadding.clear();
            this.length.clear();
            this.lengthRatio.clear();
            this.fill.clear();
            this.rgb.clear();
            this.motion.clear();
            this.phaseOffset.clear();
            this.frequency.clear();
            this.reverse.clear();
        };
        RotaryTrackEditor.prototype.terminate = function () {
            this.clear();
            this.terminator.terminate();
        };
        return RotaryTrackEditor;
    }());
    exports.RotaryTrackEditor = RotaryTrackEditor;
});
define("rotary/render", ["require", "exports", "rotary/model", "lib/common"], function (require, exports, model_2, common_7) {
    "use strict";
    exports.__esModule = true;
    var RotaryRenderer = (function () {
        function RotaryRenderer(context, rotary) {
            this.context = context;
            this.rotary = rotary;
            this.highlight = null;
        }
        RotaryRenderer.prototype.draw = function (position) {
            var radiusMin = this.rotary.radiusMin.get();
            for (var i = 0; i < this.rotary.tracks.size(); i++) {
                var model = this.rotary.tracks.get(i);
                this.drawTrack(model, radiusMin, position);
                radiusMin += model.width.get() + model.widthPadding.get();
            }
        };
        RotaryRenderer.prototype.drawTrack = function (model, radiusMin, position) {
            var phase = model.map(position);
            var segments = model.segments.get();
            var scale = model.length.get() / segments;
            var width = model.width.get();
            var thickness = model.widthPadding.get() * 0.5;
            var r0 = radiusMin + thickness;
            var r1 = radiusMin + thickness + width;
            for (var i = 0; i < segments; i++) {
                var angleMin = phase + i * scale;
                var angleMax = angleMin + scale * model.lengthRatio.get();
                this.drawSection(model, r0, r1, angleMin, angleMax, model.fill.get());
            }
        };
        RotaryRenderer.prototype.drawSection = function (model, radiusMin, radiusMax, angleMin, angleMax, fill) {
            console.assert(radiusMin < radiusMax, "radiusMax(" + radiusMax + ") must be greater then radiusMin(" + radiusMin + ")");
            console.assert(angleMin < angleMax, "angleMax(" + angleMax + ") must be greater then angleMin(" + angleMin + ")");
            var radianMin = angleMin * common_7.TAU;
            var radianMax = angleMax * common_7.TAU;
            this.context.globalAlpha = model === this.highlight || null === this.highlight ? 1.0 : 0.2;
            if (fill === model_2.Fill.Flat) {
                this.context.fillStyle = model.opaque();
            }
            else if (fill === model_2.Fill.Stroke || fill === model_2.Fill.Line) {
                this.context.strokeStyle = model.opaque();
            }
            else {
                var gradient = this.context.createConicGradient(radianMin, 0.0, 0.0);
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
                this.context.fillStyle = gradient;
            }
            if (fill === model_2.Fill.Line) {
                var sn = Math.sin(radianMin);
                var cs = Math.cos(radianMin);
                this.context.beginPath();
                this.context.moveTo(cs * radiusMin, sn * radiusMin);
                this.context.lineTo(cs * radiusMax, sn * radiusMax);
                this.context.closePath();
            }
            else {
                this.context.beginPath();
                this.context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false);
                this.context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true);
                this.context.closePath();
            }
            if (fill === model_2.Fill.Stroke || fill === model_2.Fill.Line) {
                this.context.stroke();
            }
            else {
                this.context.fill();
            }
        };
        RotaryRenderer.prototype.showHighlight = function (model) {
            this.highlight = model;
        };
        RotaryRenderer.prototype.releaseHighlight = function () {
            this.highlight = null;
        };
        return RotaryRenderer;
    }());
    exports.RotaryRenderer = RotaryRenderer;
});
define("rotary/ui", ["require", "exports", "lib/common", "dom/inputs", "rotary/editor", "dom/common", "lib/math", "lib/mapping"], function (require, exports, common_8, inputs_2, editor_1, common_9, math_2, mapping_5) {
    "use strict";
    exports.__esModule = true;
    var RotaryUI = (function () {
        function RotaryUI(form, selectors, template, model, renderer) {
            var _this = this;
            this.form = form;
            this.selectors = selectors;
            this.template = template;
            this.model = model;
            this.renderer = renderer;
            this.terminator = new common_8.Terminator();
            this.editor = new editor_1.RotaryTrackEditor(this, document);
            this.map = new Map();
            this.random = new math_2.Mulberry32(0x123abc456);
            this.terminator["with"](new inputs_2.NumericStepperInput(document.querySelector("[data-parameter='start-radius']"), mapping_5.PrintMapping.integer("px"), new common_8.NumericStepper(1)))["with"](model.radiusMin);
            this.terminator["with"](model.tracks.addObserver(function (event) {
                switch (event.type) {
                    case common_8.CollectionEventType.Add: {
                        _this.createSelector(event.item, event.index);
                        break;
                    }
                    case common_8.CollectionEventType.Remove: {
                        _this.removeSelector(event.item);
                        break;
                    }
                    case common_8.CollectionEventType.Order: {
                        _this.reorderSelectors();
                        break;
                    }
                }
            }));
            this.terminator["with"](common_9.Dom.bindEventListener(form.querySelector("#unshift-new-track"), "click", function (event) {
                event.preventDefault();
                _this.select(_this.model.createTrack(0).randomize(_this.random));
            }));
            this.model.tracks.forEach(function (track) { return _this.createSelector(track); });
            if (0 < this.model.tracks.size())
                this.select(this.model.tracks.get(0));
        }
        RotaryUI.create = function (rotary, renderer) {
            var form = document.querySelector("form.track-nav");
            var selectors = form.querySelector("#track-selectors");
            var template = selectors.querySelector("#template-selector-track");
            template.remove();
            return new RotaryUI(form, selectors, template, rotary, renderer);
        };
        RotaryUI.prototype.createNew = function (model, copy) {
            if (this.editor.subject.isEmpty()) {
                this.select(this.model.createTrack(0).randomize(this.random));
                return;
            }
            model = null === model ? this.editor.subject.get() : model;
            var index = this.model.tracks.indexOf(model);
            console.assert(-1 !== index, "Could not find model");
            var newModel = copy
                ? this.model.copyTrack(model, index + 1)
                : this.model.createTrack(index + 1).randomize(this.random);
            this.select(newModel);
        };
        RotaryUI.prototype.deleteTrack = function () {
            var _this = this;
            this.editor.subject.ifPresent(function (model) {
                var beforeIndex = _this.model.tracks.indexOf(model);
                console.assert(-1 !== beforeIndex, "Could not find model");
                _this.model.removeTrack(model);
                var numTracks = _this.model.tracks.size();
                if (0 < numTracks) {
                    _this.select(_this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)));
                }
                else {
                    _this.editor.clear();
                }
            });
        };
        RotaryUI.prototype.select = function (model) {
            console.assert(model != undefined, "Cannot select");
            this.editor.edit(model);
            var selector = this.map.get(model);
            console.assert(selector != undefined, "Cannot select");
            selector.radio.checked = true;
        };
        RotaryUI.prototype.hasSelected = function () {
            return this.editor.subject.nonEmpty();
        };
        RotaryUI.prototype.showHighlight = function (model) {
            this.renderer.showHighlight(model);
        };
        RotaryUI.prototype.releaseHighlight = function () {
            this.renderer.releaseHighlight();
        };
        RotaryUI.prototype.createSelector = function (track, index) {
            if (index === void 0) { index = Number.MAX_SAFE_INTEGER; }
            var element = this.template.cloneNode(true);
            var radio = element.querySelector("input[type=radio]");
            var button = element.querySelector("button");
            var selector = new RotaryTrackSelector(this, track, element, radio, button);
            selector.setIndex(Math.min(index, this.map.size));
            this.map.set(track, selector);
            common_9.Dom.insertElement(this.selectors, element, index);
            if (!this.hasSelected() && 0 < this.model.tracks.size())
                this.select(this.model.tracks.get(0));
        };
        RotaryUI.prototype.removeSelector = function (track) {
            var _this = this;
            var selector = this.map.get(track);
            var deleted = this.map["delete"](track);
            console.assert(selector !== undefined && deleted, "Cannot remove selector");
            selector.terminate();
            this.model.tracks.forEach(function (track, index) {
                var selector = _this.map.get(track);
                console.assert(selector !== undefined, "Cannot reorder selector");
                selector.setIndex(index);
            });
            if (this.editor.subject.contains(track))
                this.editor.clear();
        };
        RotaryUI.prototype.reorderSelectors = function () {
            var _this = this;
            common_9.Dom.emptyNode(this.selectors);
            this.model.tracks.forEach(function (track, index) {
                var selector = _this.map.get(track);
                console.assert(selector !== undefined, "Cannot reorder selector");
                _this.selectors.appendChild(selector.element);
                selector.setIndex(index);
            });
        };
        return RotaryUI;
    }());
    exports.RotaryUI = RotaryUI;
    var RotaryTrackSelector = (function () {
        function RotaryTrackSelector(ui, model, element, radio, button) {
            var _this = this;
            this.ui = ui;
            this.model = model;
            this.element = element;
            this.radio = radio;
            this.button = button;
            this.terminator = new common_8.Terminator();
            this.terminator["with"](common_9.Dom.bindEventListener(this.radio, "change", function () { return _this.ui.select(_this.model); }));
            this.terminator["with"](common_9.Dom.bindEventListener(this.element, "mouseenter", function () { return _this.ui.showHighlight(model); }));
            this.terminator["with"](common_9.Dom.bindEventListener(this.element, "mouseleave", function () { return _this.ui.releaseHighlight(); }));
            this.terminator["with"](common_9.Dom.bindEventListener(this.button, "click", function (event) {
                event.preventDefault();
                _this.ui.createNew(_this.model, event.shiftKey);
            }));
        }
        RotaryTrackSelector.prototype.setIndex = function (index) {
            this.element.querySelector("span").textContent = String(index + 1);
        };
        RotaryTrackSelector.prototype.terminate = function () {
            this.element.remove();
            this.terminator.terminate();
        };
        return RotaryTrackSelector;
    }());
    exports.RotaryTrackSelector = RotaryTrackSelector;
});
define("main", ["require", "exports", "rotary/model", "rotary/ui", "rotary/render", "lib/math"], function (require, exports, model_3, ui_1, render_1, math_3) {
    "use strict";
    exports.__esModule = true;
    var MenuBar = menu.MenuBar;
    var ListItem = menu.ListItem;
    var canvas = document.querySelector("canvas");
    var labelSize = document.querySelector("label.size");
    var context = canvas.getContext("2d", { alpha: true });
    var model = new model_3.RotaryModel().randomize(new math_3.Mulberry32(Math.floor(0x987123F * Math.random())));
    var renderer = new render_1.RotaryRenderer(context, model);
    var ui = ui_1.RotaryUI.create(model, renderer);
    var pickerOpts = { types: [{ description: "rotary", accept: { "json/*": [".json"] } }] };
    var nav = document.querySelector("nav#app-menu");
    MenuBar.install()
        .offset(0, 0)
        .addButton(nav.querySelector("[data-menu='file']"), ListItem.root()
        .addListItem(ListItem["default"]("Open...", "", false)
        .onTrigger(function () { return __awaiter(void 0, void 0, void 0, function () {
        var fileHandles, fileStream, text, format;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, window.showOpenFilePicker(pickerOpts)];
                case 1:
                    fileHandles = _a.sent();
                    if (0 === fileHandles.length) {
                        return [2];
                    }
                    return [4, fileHandles[0].getFile()];
                case 2:
                    fileStream = _a.sent();
                    return [4, fileStream.text()];
                case 3:
                    text = _a.sent();
                    return [4, JSON.parse(text)];
                case 4:
                    format = _a.sent();
                    model.deserialize(format);
                    return [2];
            }
        });
    }); }))
        .addListItem(ListItem["default"]("Save...", "", false)
        .onTrigger(function () { return __awaiter(void 0, void 0, void 0, function () {
        var fileHandle, fileStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, window.showSaveFilePicker(pickerOpts)];
                case 1:
                    fileHandle = _a.sent();
                    return [4, fileHandle.createWritable()];
                case 2:
                    fileStream = _a.sent();
                    return [4, fileStream.write(new Blob([JSON.stringify(model.serialize())], { type: "application/json" }))];
                case 3:
                    _a.sent();
                    return [4, fileStream.close()];
                case 4:
                    _a.sent();
                    return [2];
            }
        });
    }); }))
        .addListItem(ListItem["default"]("Clear", "", false)
        .onTrigger(function () { return model.clear(); }))
        .addListItem(ListItem["default"]("Randomize", "", false)
        .onTrigger(function () { return model.randomize(new math_3.Mulberry32(Math.floor(0x987123F * Math.random()))); }))
        .addListItem(ListItem["default"]("Randomize Track(s)", "", false)
        .onTrigger(function () { return model.randomizeTracks(new math_3.Mulberry32(Math.floor(0x987123F * Math.random()))); })))
        .addButton(nav.querySelector("[data-menu='edit']"), ListItem.root()
        .addListItem(ListItem["default"]("Create Track", "", false)
        .onTrigger(function () {
        ui.createNew(null, false);
    }))
        .addListItem(ListItem["default"]("Copy Track", "", false)
        .onOpening(function (item) { return item.isSelectable(ui.hasSelected()); })
        .onTrigger(function () {
        ui.createNew(null, true);
    }))
        .addListItem(ListItem["default"]("Delete Track", "", false)
        .onOpening(function (item) { return item.isSelectable(ui.hasSelected()); })
        .onTrigger(function () {
        ui.deleteTrack();
    })))
        .addButton(nav.querySelector("[data-menu='view']"), ListItem.root()
        .addListItem(ListItem["default"]("Nothing yet", "", false)))
        .addButton(nav.querySelector("[data-menu='help']"), ListItem.root()
        .addListItem(ListItem["default"]("Nothing yet", "", false)));
    var progressIndicator = document.getElementById("progress");
    var radiant = parseInt(progressIndicator.getAttribute("r"), 10) * 2.0 * Math.PI;
    progressIndicator.setAttribute("stroke-dasharray", radiant.toFixed(2));
    var setProgress = function (value) { return progressIndicator.setAttribute("stroke-dashoffset", ((1.0 - value) * radiant).toFixed(2)); };
    var frame = 0;
    (function () {
        console.log("ready...");
        var prevTime = NaN;
        var seconds = 8.0;
        var enterFrame = function (time) {
            if (!isNaN(prevTime)) {
            }
            prevTime = time;
            var position = time / (1000.0 * seconds);
            var progress = position - Math.floor(position);
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
            renderer.draw(progress);
            context.restore();
            setProgress(progress);
            frame++;
            requestAnimationFrame(enterFrame);
        };
        requestAnimationFrame(enterFrame);
    })();
});
var menu;
(function (menu_1) {
    var ListItemDefaultData = (function () {
        function ListItemDefaultData(label, shortcut, checked) {
            if (shortcut === void 0) { shortcut = ""; }
            if (checked === void 0) { checked = false; }
            this.label = label;
            this.shortcut = shortcut;
            this.checked = checked;
        }
        ListItemDefaultData.prototype.toString = function () {
            return this.label;
        };
        return ListItemDefaultData;
    }());
    menu_1.ListItemDefaultData = ListItemDefaultData;
    var ListItem = (function () {
        function ListItem(data) {
            this.data = data;
            this.separatorBefore = false;
            this.selectable = true;
            this.permanentChildren = [];
            this.transientChildren = [];
            this.transientChildrenCallback = null;
            this.openingCallback = null;
            this.triggerCallback = null;
            this.isOpening = false;
        }
        ListItem.root = function () {
            return new ListItem(null);
        };
        ListItem["default"] = function (label, shortcut, checked) {
            return new ListItem(new ListItemDefaultData(label, shortcut, checked));
        };
        ListItem.prototype.addListItem = function (listItem) {
            if (this.isOpening) {
                this.transientChildren.push(listItem);
            }
            else {
                this.permanentChildren.push(listItem);
            }
            return this;
        };
        ListItem.prototype.opening = function () {
            if (null !== this.openingCallback) {
                this.openingCallback(this);
            }
        };
        ListItem.prototype.trigger = function () {
            if (null === this.triggerCallback) {
                console.log("You selected '" + this.data + "'");
            }
            else {
                this.triggerCallback(this);
            }
        };
        ListItem.prototype.isSelectable = function (value) {
            if (value === void 0) { value = true; }
            this.selectable = value;
            return this;
        };
        ListItem.prototype.addSeparatorBefore = function () {
            this.separatorBefore = true;
            return this;
        };
        ListItem.prototype.addRuntimeChildrenCallback = function (callback) {
            this.transientChildrenCallback = callback;
            return this;
        };
        ListItem.prototype.onOpening = function (callback) {
            this.openingCallback = callback;
            return this;
        };
        ListItem.prototype.onTrigger = function (callback) {
            this.triggerCallback = callback;
            return this;
        };
        ListItem.prototype.hasChildren = function () {
            return 0 < this.permanentChildren.length || null !== this.transientChildrenCallback;
        };
        ListItem.prototype.collectChildren = function () {
            if (null === this.transientChildrenCallback) {
                return this.permanentChildren;
            }
            this.isOpening = true;
            this.transientChildrenCallback(this);
            this.isOpening = false;
            return this.permanentChildren.concat(this.transientChildren);
        };
        ListItem.prototype.removeTransientChildren = function () {
            this.transientChildren.splice(0, this.transientChildren.length);
        };
        return ListItem;
    }());
    menu_1.ListItem = ListItem;
    var Controller = (function () {
        function Controller() {
            var _this = this;
            this.root = null;
            this.layer = null;
            this.onClose = null;
            this.mouseDownHandler = function (event) {
                if (null === _this.root) {
                    throw new Error("No root");
                }
                if (!Menu.Controller.reduceAll(function (m) {
                    var rect = m.element.getBoundingClientRect();
                    return event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom;
                })) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    _this.close();
                }
            };
        }
        Controller.prototype.open = function (listItem, onClose, x, y, docked) {
            if (null === this.layer) {
                this.layer = document.createElement("div");
                this.layer.classList.add("menu-layer");
                document.body.appendChild(this.layer);
            }
            else if (null !== this.root) {
                this.close();
            }
            this.root = new Menu(listItem, docked);
            this.root.moveTo(x, y);
            this.root.attach(this.layer, null);
            this.onClose = onClose;
            window.addEventListener("mousedown", this.mouseDownHandler, true);
        };
        Controller.prototype.close = function () {
            if (null === this.root) {
                throw new Error("Cannot close root.");
            }
            this.onClose();
            this.onClose = null;
            this.root.dispose();
            this.root = null;
        };
        Controller.prototype.onDispose = function (pullDown) {
            if (this.root === pullDown) {
                window.removeEventListener("mousedown", this.mouseDownHandler, true);
                this.root = null;
            }
        };
        Controller.prototype.shutdown = function () {
            this.iterateAll(function (menu) { return menu.element.classList.add("shutdown"); });
        };
        Controller.prototype.iterateAll = function (callback) {
            var menu = this.root;
            do {
                callback(menu);
                menu = menu.childMenu;
            } while (menu !== null);
        };
        Controller.prototype.reduceAll = function (callback) {
            var menu = this.root;
            var result = 0;
            do {
                result |= callback(menu);
                menu = menu.childMenu;
            } while (menu !== null);
            return result;
        };
        return Controller;
    }());
    var Menu = (function () {
        function Menu(listItem, docked) {
            var _this = this;
            if (docked === void 0) { docked = false; }
            this.listItem = listItem;
            this.childMenu = null;
            this.element = document.createElement("nav");
            this.container = document.createElement("div");
            this.scrollUp = document.createElement("div");
            this.scrollDown = document.createElement("div");
            this.selectedDiv = null;
            this.x = 0 | 0;
            this.y = 0 | 0;
            this.element.classList.add("menu");
            this.element.addEventListener("contextmenu", function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }, true);
            if (docked) {
                this.element.classList.add("docked");
            }
            this.container = document.createElement("div");
            this.container.classList.add("container");
            this.scrollUp = document.createElement("div");
            this.scrollUp.textContent = "▲";
            this.scrollUp.classList.add("transparent");
            this.scrollUp.classList.add("scroll");
            this.scrollUp.classList.add("up");
            this.scrollDown = document.createElement("div");
            this.scrollDown.textContent = "▼";
            this.scrollDown.classList.add("transparent");
            this.scrollDown.classList.add("scroll");
            this.scrollDown.classList.add("down");
            this.element.appendChild(this.scrollUp);
            this.element.appendChild(this.container);
            this.element.appendChild(this.scrollDown);
            var _loop_1 = function (listItem_1) {
                listItem_1.opening();
                if (listItem_1.separatorBefore) {
                    this_1.container.appendChild(document.createElement("hr"));
                }
                var div = document.createElement("div");
                if (listItem_1.selectable) {
                    div.classList.add("selectable");
                }
                else {
                    div.classList.remove("selectable");
                }
                if (listItem_1.hasChildren()) {
                    div.classList.add("has-children");
                }
                div.onmouseenter = function () {
                    if (null !== _this.selectedDiv) {
                        _this.selectedDiv.classList.remove("selected");
                        _this.selectedDiv = null;
                    }
                    div.classList.add("selected");
                    _this.selectedDiv = div;
                    var hasChildren = listItem_1.hasChildren();
                    if (null !== _this.childMenu) {
                        if (hasChildren && _this.childMenu.listItem === listItem_1) {
                            return;
                        }
                        _this.childMenu.dispose();
                        _this.childMenu = null;
                    }
                    if (hasChildren) {
                        var divRect = div.getBoundingClientRect();
                        _this.childMenu = new Menu(listItem_1);
                        _this.childMenu.moveTo(divRect.left + divRect.width, divRect.top - 8);
                        _this.childMenu.attach(_this.element.parentElement, _this);
                    }
                };
                div.onmouseleave = function (event) {
                    if (_this.isChild(event.relatedTarget)) {
                        return;
                    }
                    div.classList.remove("selected");
                    _this.selectedDiv = null;
                    if (null !== _this.childMenu) {
                        _this.childMenu.dispose();
                        _this.childMenu = null;
                    }
                };
                div.onmouseup = function (event) {
                    event.preventDefault();
                    if (null === _this.childMenu) {
                        div.addEventListener("animationend", function () {
                            listItem_1.trigger();
                            Menu.Controller.close();
                        }, { once: true });
                        div.classList.add("triggered");
                        Menu.Controller.shutdown();
                    }
                    return true;
                };
                var renderer = Menu.Renderer.get(listItem_1.data.constructor);
                if (renderer) {
                    renderer(div, listItem_1.data);
                }
                else {
                    throw new Error("No renderer found for " + listItem_1.data);
                }
                this_1.container.appendChild(div);
            };
            var this_1 = this;
            for (var _i = 0, _a = this.listItem.collectChildren(); _i < _a.length; _i++) {
                var listItem_1 = _a[_i];
                _loop_1(listItem_1);
            }
        }
        Menu.prototype.moveTo = function (x, y) {
            this.x = x | 0;
            this.y = y | 0;
            this.element.style.transform = "translate(" + this.x + "px, " + this.y + "px)";
        };
        Menu.prototype.attach = function (parentNode, parentMenu) {
            if (parentMenu === void 0) { parentMenu = null; }
            parentNode.appendChild(this.element);
            var clientRect = this.element.getBoundingClientRect();
            if (clientRect.left + clientRect.width > parentNode.clientWidth) {
                if (null === parentMenu || undefined === parentMenu) {
                    this.moveTo(this.x - clientRect.width, this.y);
                }
                else {
                    this.moveTo(parentMenu.x - clientRect.width, this.y);
                }
            }
            if (clientRect.height >= parentNode.clientHeight) {
                this.moveTo(this.x, 0);
                this.makeScrollable();
            }
            else if (clientRect.top + clientRect.height > parentNode.clientHeight) {
                this.moveTo(this.x, parentNode.clientHeight - clientRect.height);
            }
        };
        Menu.prototype.dispose = function () {
            if (null !== this.childMenu) {
                this.childMenu.dispose();
                this.childMenu = null;
            }
            Menu.Controller.onDispose(this);
            this.element.remove();
            this.element = null;
            this.listItem.removeTransientChildren();
            this.listItem = null;
            this.selectedDiv = null;
        };
        Menu.prototype.domElement = function () {
            return this.element;
        };
        Menu.prototype.isChild = function (target) {
            if (null === this.childMenu) {
                return false;
            }
            while (null !== target) {
                if (target === this.element) {
                    return false;
                }
                if (target === this.childMenu.domElement()) {
                    return true;
                }
                target = target.parentNode;
            }
            return false;
        };
        Menu.prototype.makeScrollable = function () {
            var _this = this;
            var scroll = function (direction) { return _this.container.scrollTop += direction; };
            this.element.classList.add("overflowing");
            this.element.addEventListener("wheel", function (event) { return scroll(Math.sign(event.deltaY) * 6); }, { passive: false });
            var canScroll = function (direction) {
                if (0 > direction && 0 === _this.container.scrollTop) {
                    return false;
                }
                if (0 < direction && _this.container.scrollTop === _this.container.scrollHeight - _this.container.clientHeight) {
                    return false;
                }
                return true;
            };
            var setup = function (button, direction) {
                button.onmouseenter = function () {
                    if (!canScroll(direction)) {
                        return;
                    }
                    button.classList.add("scrolling");
                    var active = true;
                    var scrolling = function () {
                        scroll(direction);
                        if (!canScroll(direction)) {
                            active = false;
                        }
                        if (active) {
                            window.requestAnimationFrame(scrolling);
                        }
                        else {
                            button.classList.remove("scrolling");
                        }
                    };
                    window.requestAnimationFrame(scrolling);
                    button.onmouseleave = function () {
                        active = false;
                        button.onmouseup = null;
                    };
                };
            };
            setup(this.scrollUp, -8);
            setup(this.scrollDown, 8);
        };
        Menu.Controller = new Controller();
        Menu.Renderer = new Map();
        return Menu;
    }());
    menu_1.Menu = Menu;
    Menu.Renderer.set(ListItemDefaultData, function (element, data) {
        element.classList.add("default");
        element.innerHTML =
            "<svg class=\"check-icon\"><use xlink:href=\"#menu-checked\"></use></svg>\n             <span class=\"label\">" + data.label + "</span>\n             <span class=\"shortcut\">" + data.shortcut + "</span>\n             <svg class=\"children-icon\"><use xlink:href=\"#menu-children\"></use></svg>";
        if (data.checked) {
            element.classList.add("checked");
        }
    });
    var MenuBar = (function () {
        function MenuBar() {
            this.offsetX = 0;
            this.offsetY = 0;
            this.openListItem = null;
        }
        MenuBar.install = function () {
            return new MenuBar();
        };
        MenuBar.prototype.offset = function (x, y) {
            this.offsetX = x;
            this.offsetY = y;
            return this;
        };
        MenuBar.prototype.addButton = function (button, listItem) {
            var _this = this;
            button.onmousedown = function () { return _this.open(button, listItem); };
            button.onmouseenter = function () {
                if (null !== _this.openListItem && _this.openListItem !== listItem) {
                    _this.open(button, listItem);
                }
            };
            return this;
        };
        MenuBar.prototype.open = function (button, listItem) {
            var _this = this;
            button.classList.add("selected");
            var rect = button.getBoundingClientRect();
            var x = rect.left + this.offsetX;
            var y = rect.bottom + this.offsetY;
            var onClose = function () {
                _this.openListItem = null;
                button.classList.remove("selected");
            };
            Menu.Controller.open(listItem, onClose, x, y, true);
            this.openListItem = listItem;
        };
        return MenuBar;
    }());
    menu_1.MenuBar = MenuBar;
})(menu || (menu = {}));
//# sourceMappingURL=main.js.map