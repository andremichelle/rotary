import {ControlBuilder, UIControllerLayout} from "../dom/controls.js"
import {
    CompositeSettings,
    ConvolverFiles,
    ConvolverSettings,
    FlangerSettings,
    PulsarDelay,
    PulsarDelaySettings
} from "./composite.js"
import {NoArgType, NumericStepper, PrintMapping} from "../lib/common.js"

export const SettingsControlBuilder = new class implements ControlBuilder<CompositeSettings<any>> {
    availableTypes = new Map<string, NoArgType<CompositeSettings<any>>>([
        ["PulsarDelay", PulsarDelaySettings],
        ["Convolver", ConvolverSettings],
        ["Flanger", FlangerSettings]
    ])

    build(layout: UIControllerLayout, settings: CompositeSettings<any>): void {
        if (settings instanceof PulsarDelaySettings) {
            layout.createNumericStepper("Pre-Delay L", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.preDelayTimeL)
            layout.createNumericStepper("Pre-Delay R", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.preDelayTimeR)
            layout.createNumericStepper("Delay ⟳", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.feedbackDelayTime)
            layout.createNumericStepper("Feedback ⟳", PrintMapping.UnipolarPercent,
                new NumericStepper(0.001)).with(settings.feedbackGain)
            layout.createNumericStepper("Lowpass ⟳", PrintMapping.integer("Hz"),
                new NumericStepper(1)).with(settings.feedbackLowpass)
            layout.createNumericStepper("Highpass ⟳", PrintMapping.integer("Hz"),
                new NumericStepper(1)).with(settings.feedbackHighpass)
        } else if (settings instanceof ConvolverSettings) {
            layout.createSelect("Impulse", ConvolverFiles).with(settings.url)
        } else if (settings instanceof FlangerSettings) {
            layout.createNumericStepper("delay", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.delayTime)
            layout.createNumericStepper("feedback", PrintMapping.UnipolarPercent,
                new NumericStepper(0.01)).with(settings.feedback)
            layout.createNumericStepper("rate", PrintMapping.float(2, "", "Hz"),
                new NumericStepper(0.01)).with(settings.rate)
            layout.createNumericStepper("depth", PrintMapping.UnipolarPercent,
                new NumericStepper(0.01)).with(settings.depth)
        }
    }
}