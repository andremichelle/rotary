import {RotaryModel} from "./rotary/model"
import {RotarySelector} from "./rotary/view";
import {RotaryRenderer} from "./rotary/render";
import ListItem = menu.ListItem;
import MenuBar = menu.MenuBar;

const model = new RotaryModel()
RotarySelector.create(document, model)
;

const nav = document.querySelector("nav#app-menu")
MenuBar.install()
    .offset(1, 0)
    .addButton(nav.querySelector("[data-menu='file']"), ListItem.root()
        .addListItem(ListItem.default("Nothing here", "", false))
        .addListItem(ListItem.default("Obviously", "", false))
        .addListItem(ListItem.default("Maybe", "", false))
        .addListItem(ListItem.default("Nope.", "", false))
    )
    .addButton(nav.querySelector("[data-menu='edit']"), ListItem.root()
        .addListItem(ListItem.default("First?", "", false)))
    .addButton(nav.querySelector("[data-menu='view']"), ListItem.root()
        .addListItem(ListItem.default("View?", "", false)))
    .addButton(nav.querySelector("[data-menu='create']"), ListItem.root()
        .addListItem(ListItem.default("What?", "", false)))
    .addButton(nav.querySelector("[data-menu='help']"), ListItem.root()
        .addListItem(ListItem.default("Help!", "", false)))
;

let frame: number = 0;

(() => {
    console.log("ready...")
    const canvas = document.querySelector("canvas")
    const labelSize = document.querySelector("label.size");
    const context = canvas.getContext("2d", {alpha: true})

    const enterFrame = () => {
        const size = model.measureRadius() * 2
        const ratio = Math.ceil(devicePixelRatio)
        canvas.width = size * ratio
        canvas.height = size * ratio
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        labelSize.textContent = `${size}`

        context.clearRect(0.0, 0.0, size, size)
        context.save()
        context.scale(ratio, ratio)
        context.translate(size >> 1, size >> 1)
        RotaryRenderer.draw(context, model, frame / 320.0)
        context.restore()

        frame++
        requestAnimationFrame(enterFrame)
    }
    enterFrame()
})()
