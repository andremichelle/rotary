import { ArrayUtils, NumericStepper, Options, PrintMapping, Terminator } from "../lib/common.js";
import { NumericStepperInput } from "../dom/inputs.js";
import { Fills, RotaryModel } from "./model.js";
import { InjectiveEditor } from "../dom/injective.js";
import { UIControllerLayout } from "../dom/controls.js";
import { Dom } from "../dom/common.js";
export class RotaryTrackEditor {
    constructor(executor, parentNode) {
        this.executor = executor;
        this.terminator = new Terminator();
        this.subject = Options.None;
        const layoutL = this.terminator.with(new UIControllerLayout(parentNode.querySelector(".visuals-left")));
        const layoutR = this.terminator.with(new UIControllerLayout(parentNode.querySelector(".visuals-right")));
        this.segments = layoutL.createNumericStepper("segments", PrintMapping.integer(""), NumericStepper.Integer);
        this.width = layoutL.createNumericStepper("width", PrintMapping.integer("px"), NumericStepper.Integer);
        this.widthPadding = layoutL.createNumericStepper("padding", PrintMapping.integer("px"), NumericStepper.Integer);
        this.length = layoutR.createNumericStepper("length", PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
        this.lengthRatio = layoutR.createNumericStepper("thickness", PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
        this.outline = layoutL.createNumericStepper("outline", PrintMapping.integer("px"), NumericStepper.Integer);
        this.fill = layoutL.createSelect("fill", Fills);
        this.rgb = layoutL.createNumericInput("rgb", PrintMapping.RGB);
        this.phaseOffset = layoutR.createNumericStepper("phase offset", PrintMapping.UnipolarPercent, NumericStepper.Hundredth);
        this.frequency = layoutR.createNumericStepper("frequency", PrintMapping.integer("x"), NumericStepper.Integer);
        this.fragments = layoutR.createNumericStepper("fragments", PrintMapping.integer("x"), NumericStepper.Integer);
        this.reverse = layoutR.createCheckbox("reverse");
        this.motion = new InjectiveEditor(parentNode.querySelector(".motion"), "motion");
        this.bend = this.terminator.with(new InjectiveEditor(parentNode.querySelector(".bend"), "bend"));
        this.volume = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='volume']"), PrintMapping.UnipolarPercent, NumericStepper.Hundredth));
        this.panning = this.terminator.with(new NumericStepperInput(parentNode.querySelector("fieldset[data-parameter='panning']"), PrintMapping.UnipolarPercent, NumericStepper.Hundredth));
        this.auxSends = ArrayUtils.fill(RotaryModel.NUM_AUX, (index) => this.terminator.with(new NumericStepperInput(parentNode.querySelector(`fieldset[data-parameter='aux-${index}']`), PrintMapping.UnipolarPercent, NumericStepper.Hundredth)));
        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.delete"), "click", event => {
            event.preventDefault();
            this.subject.ifPresent((trackModel) => executor.deleteTrack(trackModel));
        }));
        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.move-left"), "click", event => {
            event.preventDefault();
            this.subject.ifPresent((trackModel) => executor.moveTrackLeft(trackModel));
        }));
        this.terminator.with(Dom.bindEventListener(parentNode.querySelector("button.move-right"), "click", event => {
            event.preventDefault();
            this.subject.ifPresent((trackModel) => executor.moveTrackRight(trackModel));
        }));
    }
    edit(model) {
        this.segments.with(model.segments);
        this.width.with(model.width);
        this.widthPadding.with(model.widthPadding);
        this.length.with(model.length);
        this.lengthRatio.with(model.lengthRatio);
        this.outline.with(model.outline);
        this.fill.with(model.fill);
        this.rgb.with(model.rgb);
        this.motion.with(model.motion);
        this.bend.with(model.bend);
        this.phaseOffset.with(model.phaseOffset);
        this.frequency.with(model.frequency);
        this.fragments.with(model.fragments);
        this.reverse.with(model.reverse);
        this.volume.with(model.volume);
        this.panning.with(model.panning);
        this.auxSends[0].with(model.aux[0]);
        this.auxSends[1].with(model.aux[1]);
        this.auxSends[2].with(model.aux[2]);
        this.auxSends[3].with(model.aux[3]);
        this.subject = Options.valueOf(model);
    }
    clear() {
        this.subject = Options.None;
        this.segments.clear();
        this.width.clear();
        this.widthPadding.clear();
        this.length.clear();
        this.lengthRatio.clear();
        this.outline.clear();
        this.fill.clear();
        this.rgb.clear();
        this.motion.clear();
        this.bend.clear();
        this.phaseOffset.clear();
        this.frequency.clear();
        this.fragments.clear();
        this.reverse.clear();
        this.volume.clear();
        this.panning.clear();
        this.auxSends[0].clear();
        this.auxSends[1].clear();
        this.auxSends[2].clear();
        this.auxSends[3].clear();
    }
    terminate() {
        this.clear();
        this.terminator.terminate();
    }
}
//# sourceMappingURL=editor.js.map