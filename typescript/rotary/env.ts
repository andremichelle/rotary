import {ListItem, MenuBar} from "../dom/menu.js"
import {Mulberry32} from "../lib/math.js"
import {RotaryModel} from "./model.js"
import {RotaryApp} from "./app.js"
import {open, save, render} from "./file.js"

const zoomLevel: Map<string, number> = new Map([
    ["100%", 1.0], ["75%", 0.75], ["66%", 2.0 / 3.0], ["50%", 0.5], ["33%", 1.0 / 3.0], ["25%", 0.25]
])

export const installApplicationMenu = (element: HTMLElement, model: RotaryModel, ui: RotaryApp): void => {
    MenuBar.install()
        .offset(0, 0)
        .addButton(element.querySelector("[data-menu='file']"), ListItem.root()
            .addListItem(ListItem.default("Open...", "", false)
                .onTrigger(async () => open(model)))
            .addListItem(ListItem.default("Save...", "", false)
                .onTrigger(async () => save(model)))
            .addListItem(ListItem.default("Render...", "", false)
                .onTrigger(() => render()))
            .addListItem(ListItem.default("Clear", "", false)
                .onTrigger(() => model.clear()))
            .addListItem(ListItem.default("Randomize All", "", false)
                .addSeparatorBefore()
                .onTrigger(() => model.randomize(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Randomize Existing Tracks", "", false)
                .isSelectable(false)
                .onTrigger(() => model.randomizeTracks(new Mulberry32(Math.floor(0x987123F * Math.random())))))
            .addListItem(ListItem.default("Randomize Track Colours", "", false)
                .onTrigger(() => model.tracks.forEach(track => track.randomizeRGB(new Mulberry32(Math.floor(0x987123F * Math.random()))))))
        )
        .addButton(element.querySelector("[data-menu='edit']"), ListItem.root()
            .addListItem(ListItem.default("Create Track", "", false)
                .onTrigger(() => {
                    ui.createNew(null, false)
                }))
            .addListItem(ListItem.default("Copy Track", "", false)
                .onOpening(item => item.isSelectable(ui.hasSelected()))
                .onTrigger(() => {
                    ui.createNew(null, true)
                }))
            .addListItem(ListItem.default("Delete Track", "", false)
                .onOpening(item => item.isSelectable(ui.hasSelected()))
                .onTrigger(() => {
                    ui.deleteTrack()
                }))
        )
        .addButton(element.querySelector("[data-menu='view']"), ListItem.root()
            .addListItem(ListItem.default("Zoom", "", false)
                .addRuntimeChildrenCallback(parent => {
                    for (const level of zoomLevel) {
                        parent.addListItem(ListItem.default(level[0], "", ui.zoom.get() === level[1])
                            .onTrigger(() => ui.zoom.set(level[1])))
                    }
                })))
        .addButton(element.querySelector("[data-menu='help']"), ListItem.root()
            .addListItem(ListItem.default("Nothing yet", "", false)))

}