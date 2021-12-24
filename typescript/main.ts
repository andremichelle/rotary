import {RotaryTrack} from "./rotary";
import {NumericStepperControl} from "./controls";

const track = new RotaryTrack()
track.numSegments.addObserver(value => console.log(`changed to ${value.get()}`))
const control = new NumericStepperControl(document.querySelector("[data-parameter='start-radius']"), track.numSegments, "px")