import {Rotary} from "./rotary"
import {NumericStepper} from "./controls"
import {PrintMapping} from "./common"


const rotary = new Rotary()
new NumericStepper(document.querySelector("[data-parameter='start-radius']"), rotary.radiusMin, PrintMapping.NoFloat, 1, "px")