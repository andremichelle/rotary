import {install} from "./common.js"
import {RotaryModel} from "./rotary/model/rotary.js"
import {Mulberry32} from "./lib/math.js"
import {RotaryRenderer} from "./rotary/render.js"

class Stencil {
    private readonly model: RotaryModel
    private readonly radius: number

    constructor(private readonly stencil: Element, seed: number) {
        this.model = new RotaryModel()
        this.model.randomize(new Mulberry32(seed))
        this.model.inactiveAlpha.set(1.0)
        this.radius = this.model.measureRadius()
    }

    render(context: CanvasRenderingContext2D, dx: number, dy: number, phase: number): void {
        const rect = this.stencil.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const halfSize = size >> 1
        const scale: number = halfSize / this.radius
        context.save()
        context.translate(rect.left + halfSize + dx, rect.top + halfSize + dy)
        context.scale(scale, scale)
        RotaryRenderer.render(context, this.model, phase, 1.0)
        context.restore()
    }
}

(async () => {
    await install()

    const stencils: Map<Element, Stencil> = new Map()
    const pattern = document.querySelector("div.pattern") as HTMLElement
    const intersectionObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const seed = parseInt(entry.target.getAttribute("seed"))
                stencils.set(entry.target, new Stencil(entry.target, seed))
            } else {
                stencils.delete(entry.target)
            }
        })
    }, {
        threshold: 0.0
    })

    let seed = 0 | 0
    const populate = (n: number): void => {
        for (let i = 0; i < n; i++) {
            const section = document.createElement("section")
            section.setAttribute("seed", `${seed++}`)
            intersectionObserver.observe(section)
            pattern.appendChild(section)
        }
    }
    const style = document.documentElement.style
    const canvas = document.querySelector("canvas")
    const context = canvas.getContext("2d")
    const size = 256
    const gap = 32
    const padding = 64
    const resize = () => {
        const columns = Math.min(5, Math.floor((window.innerWidth - padding * 2) / (size + gap)))
        style.setProperty("--columns", `${columns}`)
    }
    let phase = 0.0
    const run = () => {
        const bounds = canvas.getBoundingClientRect()
        const pixelRatio = 1//devicePixelRatio
        canvas.width = canvas.clientWidth * pixelRatio
        canvas.height = canvas.clientHeight * pixelRatio
        context.save()
        context.scale(pixelRatio, pixelRatio)
        for (const stencil of stencils.values()) {
            stencil.render(context, -bounds.left, -bounds.top, phase)
        }
        context.restore()
        phase += 1.0 / (60.0 * 8.0)
        requestAnimationFrame(run)
    }
    resize()
    populate(120)
    requestAnimationFrame(run)
    window.addEventListener("resize", () => resize())
    pattern.addEventListener("scroll", () => {
        if (pattern.scrollTop >= pattern.scrollHeight - pattern.clientHeight - size) {
            populate(24)
        }
    })
    {
        style.setProperty("--size", `${size}px`)
        style.setProperty("--gap", `${gap}px`)
        style.setProperty("--padding", `${padding}px`)
    }
    document.getElementById("preloader").remove()
    console.log("ready...")
})()