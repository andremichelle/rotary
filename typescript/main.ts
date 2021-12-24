import {Rotary, RotaryTrack} from "./rotary"
import {NumericStepper} from "./controls"
import {PrintMapping} from "./common"


const rotary = new Rotary()

const tracksContainer = document.querySelector(".tracks")
const trackTemplate = document.querySelector(".track")
trackTemplate.remove()

new NumericStepper(document.querySelector("[data-parameter='start-radius']"), rotary.radiusMin, PrintMapping.NoFloat, 1, "px")

class RotaryTrackView {
    constructor(private readonly element: HTMLElement, private readonly track: RotaryTrack) {
    }
}


let trackViews = rotary.tracks.map(track => {
    const element = trackTemplate.cloneNode(true) as HTMLElement
    tracksContainer.appendChild(element)
    return new RotaryTrackView(element, track)
})