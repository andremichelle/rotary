import {RotaryTrack} from "./rotary";
import {NumericStepper} from "./controls";
import {Linear, PrintMapping, Volume} from "./common";

const track = new RotaryTrack()
const control = new NumericStepper(document.querySelector("[data-parameter='start-radius']"), track.numSegments, "px")
