import { ConvolverSettings, FlangerSettings, PulsarDelaySettings } from "./composite.js";
import { NumericStepper, PrintMapping } from "../lib/common.js";
const Impulses = new Map([
    ["None", null],
    ["Church", "impulse/Church.ogg"],
    ["Deep Space", "impulse/DeepSpace.ogg"],
    ["Hangar", "impulse/Hangar.ogg"],
    ["Large Echo Hall", "impulse/LargeWideEchoHall.ogg"],
    ["Plate Small", "impulse/PlateSmall.ogg"],
    ["Plate Medium", "impulse/PlateMedium.ogg"],
    ["Plate Large", "impulse/PlateLarge.ogg"],
    ["Prime Long", "impulse/PrimeLong.ogg"],
]);
export const SettingsControlBuilder = new class {
    constructor() {
        this.availableTypes = new Map([
            ["PulsarDelay", PulsarDelaySettings],
            ["Convolver", ConvolverSettings],
            ["Flanger", FlangerSettings]
        ]);
    }
    build(layout, settings) {
        if (settings instanceof PulsarDelaySettings) {
            layout.createNumericStepper("Pre-Delay L", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.preDelayTimeL);
            layout.createNumericStepper("Pre-Delay R", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.preDelayTimeR);
            layout.createNumericStepper("Delay ⟳", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.feedbackDelayTime);
            layout.createNumericStepper("Feedback ⟳", PrintMapping.UnipolarPercent, new NumericStepper(0.001)).with(settings.feedbackGain);
            layout.createNumericStepper("Lowpass ⟳", PrintMapping.integer("Hz"), new NumericStepper(1)).with(settings.feedbackLowpass);
            layout.createNumericStepper("Highpass ⟳", PrintMapping.integer("Hz"), new NumericStepper(1)).with(settings.feedbackHighpass);
        }
        else if (settings instanceof ConvolverSettings) {
            layout.createSelect("Impulse", Impulses).with(settings.url);
        }
        else if (settings instanceof FlangerSettings) {
            layout.createNumericStepper("delay", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.delayTime);
            layout.createNumericStepper("feedback", PrintMapping.UnipolarPercent, new NumericStepper(0.01)).with(settings.feedback);
            layout.createNumericStepper("rate", PrintMapping.float(2, "", "Hz"), new NumericStepper(0.01)).with(settings.rate);
            layout.createNumericStepper("depth", PrintMapping.UnipolarPercent, new NumericStepper(0.01)).with(settings.depth);
        }
    }
};
//# sourceMappingURL=ui.js.map