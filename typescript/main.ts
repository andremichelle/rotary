import {RotaryTrack} from "./rotary";
import {NumericStepperControl} from "./controls";

const track = new RotaryTrack()
const control = new NumericStepperControl(document.querySelector("[data-parameter='start-radius']"), track.numSegments, "px")
