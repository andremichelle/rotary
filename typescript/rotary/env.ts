import {ListItem, MenuBar} from "../dom/menu.js"
import {Mulberry32} from "../lib/math.js"
import {RotaryModel} from "./model.js"
import {RotaryApp} from "./app.js"
import {open, render, save} from "./file.js"

const zoomLevel: Map<string, number> = new Map([
    ["100%", 1.0], ["75%", 0.75], ["66%", 2.0 / 3.0], ["50%", 0.5], ["33%", 1.0 / 3.0], ["25%", 0.25]
])

export const installApplicationMenu = (element: HTMLElement, model: RotaryModel, app: RotaryApp): void => {
    MenuBar.install()
        .offset(0, 0)
        .addButton(element.querySelector("[data-menu='file']"), ListItem.root()
            .addListItem(ListItem.default("Open...", "", false)
                .onTrigger(async () => open(model)))
            .addListItem(ListItem.default("Save...", "", false)
                .onTrigger(async () => save(model)))
            .addListItem(ListItem.default("Render...", "", false)
                .onTrigger(() => render(model)))
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
            .addListItem(ListItem.default("Colorize by colormind.io", "", false)
                .onTrigger(async () => {
                    const colors = await fetch('http://colormind.io/api/', {
                        method: 'POST',
                        body: JSON.stringify({model: 'default'})
                    })
                        .then(result => result.json())
                        .then(x => x.result.map(rgb => (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]))
                        .catch(x => new Error(x))
                    model.tracks.forEach(track => track.rgb.set(colors[Math.floor(Math.random() * colors.length)]))
                }))
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
            .addListItem(ListItem.default("Nothing yet", "", false)))
}