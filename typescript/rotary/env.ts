import {ListItem, MenuBar} from "../dom/menu.js"
import {Mulberry32} from "../lib/math.js"
import {RotaryModel} from "./model.js"
import {RotaryApp} from "./app.js"
import {open, renderGIF, renderVideo, renderWav, renderWebM, save} from "./file.js"
import {Audio} from "./audio.js"

const zoomLevel: Map<string, number> = new Map([
    ["100%", 1.0], ["75%", 0.75], ["66%", 2.0 / 3.0], ["50%", 0.5], ["33%", 1.0 / 3.0], ["25%", 0.25]
])

export const installApplicationMenu = (element: HTMLElement, model: RotaryModel, audio: Audio, app: RotaryApp): void => {
    MenuBar.install()
        .offset(0, 0)
        .addButton(element.querySelector("[data-menu='file']"), ListItem.root()
            .addListItem(ListItem.default("Open...", "", false)
                .onTrigger(async () => open(model)))
            .addListItem(ListItem.default("Save...", "", false)
                .onTrigger(async () => save(model)))
            .addListItem(ListItem.default("Export Video (experimental)", "", false)
                .onTrigger(() => renderVideo(model)))
            .addListItem(ListItem.default("Export GIF", "", false)
                .onTrigger(() => renderGIF(model)))
            .addListItem(ListItem.default("Export WebM", "", false)
                .onTrigger(() => renderWebM(model)))
            .addListItem(ListItem.default("Export Wav", "", false)
                .onTrigger(async () => renderWav(audio)))
            .addListItem(ListItem.default("Clear", "", false)
                .onTrigger(() => model.clear())))
        .addButton(element.querySelector("[data-menu='edit']"), ListItem.root()
            .addListItem(ListItem.default("Create Track", "", false)
                .onTrigger(() => app.createNew(null, false)))
            .addListItem(ListItem.default("Copy Track", "", false)
                .onOpening(item => item.isSelectable(app.hasSelected()))
                .onTrigger(() => app.createNew(null, true)))
            .addListItem(ListItem.default("Delete Track", "", false)
                .onOpening(item => item.isSelectable(app.hasSelected()))
                .onTrigger(() => app.deleteTrack()))
        )
        .addButton(element.querySelector("[data-menu='randomize']"), ListItem.root()
            .addListItem(ListItem.default("All", "", false)
                .onTrigger(() => model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Tracks", "", false)
                .onTrigger(() => model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Color", "", false)
                .onTrigger(async () => model.randomizePalette(new Mulberry32(Math.floor(0x987123F * Math.random())))))
        )
        .addButton(element.querySelector("[data-menu='view']"), ListItem.root()
            .addListItem(ListItem.default("Zoom", "", false)
                .addRuntimeChildrenCallback(parent => {
                    for (const level of zoomLevel) {
                        parent.addListItem(ListItem.default(level[0], "", app.zoom.get() === level[1])
                            .onTrigger(() => app.zoom.set(level[1])))
                    }
                })))
        .addButton(element.querySelector("[data-menu='help']"), ListItem.root()
            .addListItem(ListItem.default("Open TODOs in Github (protected)", "", false)
                .onTrigger(_ => window.open("https://github.com/andremichelle/rotary/wiki/TODOs"))))
}