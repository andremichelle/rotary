var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { install } from "./common.js";
import { RotaryModel } from "./rotary/model/rotary.js";
import { Mulberry32 } from "./lib/math.js";
import { RotaryRenderer } from "./rotary/render.js";
class Stencil {
    constructor(stencil, seed) {
        this.stencil = stencil;
        this.model = new RotaryModel();
        this.model.randomize(new Mulberry32(seed));
        this.model.inactiveAlpha.set(1.0);
        this.radius = this.model.measureRadius();
    }
    render(context, dx, dy, phase) {
        const rect = this.stencil.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const halfSize = size >> 1;
        const scale = halfSize / this.radius;
        context.save();
        context.translate(rect.left + halfSize + dx, rect.top + halfSize + dy);
        context.scale(scale, scale);
        RotaryRenderer.render(context, this.model, phase, 1.0);
        context.restore();
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield install();
    const stencils = new Map();
    const pattern = document.querySelector("div.pattern");
    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const seed = parseInt(entry.target.getAttribute("seed"));
                stencils.set(entry.target, new Stencil(entry.target, seed));
            }
            else {
                stencils.delete(entry.target);
            }
        });
    }, {
        threshold: 0.0
    });
    let seed = 0 | 0;
    const populate = (n) => {
        for (let i = 0; i < n; i++) {
            const section = document.createElement("section");
            section.setAttribute("seed", `${seed++}`);
            intersectionObserver.observe(section);
            pattern.appendChild(section);
        }
    };
    const style = document.documentElement.style;
    const canvas = document.querySelector("canvas");
    const context = canvas.getContext("2d");
    const size = 256;
    const gap = 32;
    const padding = 64;
    const resize = () => {
        const columns = Math.min(5, Math.floor((window.innerWidth - padding * 2) / (size + gap)));
        style.setProperty("--columns", `${columns}`);
    };
    let phase = 0.0;
    const run = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = 1;
        canvas.width = canvas.clientWidth * pixelRatio;
        canvas.height = canvas.clientHeight * pixelRatio;
        context.save();
        context.scale(pixelRatio, pixelRatio);
        for (const stencil of stencils.values()) {
            stencil.render(context, -bounds.left, -bounds.top, phase);
        }
        context.restore();
        phase += 1.0 / (60.0 * 8.0);
        requestAnimationFrame(run);
    };
    resize();
    populate(120);
    requestAnimationFrame(run);
    window.addEventListener("resize", () => resize());
    pattern.addEventListener("scroll", () => {
        if (pattern.scrollTop >= pattern.scrollHeight - pattern.clientHeight - size) {
            populate(24);
        }
    });
    {
        style.setProperty("--size", `${size}px`);
        style.setProperty("--gap", `${gap}px`);
        style.setProperty("--padding", `${padding}px`);
    }
    document.getElementById("preloader").remove();
    console.log("ready...");
}))();
//# sourceMappingURL=infinite.js.map