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
import { Audio } from "./rotary/audio.js";
import { initAudioScene } from "./rotary/audio.default.js";
class Stencil {
    constructor(stencil, seed) {
        this.stencil = stencil;
        this.model = new RotaryModel();
        this.model.randomize(new Mulberry32(0xFFFF + seed));
        this.model.inactiveAlpha.set(1.0);
        this.radius = this.model.measureRadius();
        this.alpha = 0.75;
    }
    activate() {
        this.model.inactiveAlpha.set(0.2);
        this.alpha = 1.0;
    }
    deactivate() {
        this.model.inactiveAlpha.set(1.0);
        this.alpha = 0.75;
    }
    render(context, dx, dy, phase) {
        const rect = this.stencil.getBoundingClientRect();
        this.size = Math.max(rect.width, rect.height);
        const halfSize = this.size >> 1;
        this.x = rect.left + halfSize + dx;
        this.y = rect.top + halfSize + dy;
        context.save();
        context.translate(this.x, this.y);
        const scale = (halfSize - 16.0) / this.radius;
        context.scale(scale, scale);
        RotaryRenderer.render(context, this.model, phase, this.alpha);
        context.restore();
    }
    terminate() {
        this.model.terminate();
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield install();
    const model = new RotaryModel();
    const audio = yield Audio.config(initAudioScene(), model);
    const preview = yield audio.initPreview();
    const stencils = new Map();
    const pattern = document.querySelector("div.pattern");
    const handleRecords = (entries) => {
        entries.forEach(entry => {
            const element = entry.target;
            if (entry.isIntersecting) {
                const seed = parseInt(element.getAttribute("seed"));
                stencils.set(element, new Stencil(element, seed));
            }
            else {
                const stencil = stencils.get(element);
                if (undefined !== stencil) {
                    stencil.terminate();
                    stencils.delete(element);
                }
            }
        });
    };
    const intersectionObserver = new IntersectionObserver(handleRecords, { threshold: 0.0 });
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
    const canvas = document.querySelector("canvas.rotaries");
    const context = canvas.getContext("2d");
    const padding = 64;
    const size = 256;
    const gap = 12;
    const resize = () => {
        const columns = Math.min(9, Math.floor((window.innerWidth - padding * 2) / (size + gap)));
        style.setProperty("--columns", `${columns}`);
    };
    const run = () => {
        handleRecords(intersectionObserver.takeRecords());
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = 1;
        canvas.width = canvas.clientWidth * pixelRatio;
        canvas.height = canvas.clientHeight * pixelRatio;
        context.save();
        context.scale(pixelRatio, pixelRatio);
        const position = preview.position();
        for (const stencil of stencils.values()) {
            stencil.render(context, -bounds.left, -bounds.top, position);
        }
        context.restore();
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
    const fieldset = document.querySelector("fieldset.controls");
    fieldset.disabled = true;
    pattern.addEventListener("click", (event) => {
        const element = event.target;
        const stencil = stencils.get(element);
        if (undefined === stencil) {
            return;
        }
        pattern.querySelectorAll("[active]").forEach(element => {
            element.removeAttribute("active");
            const stencil = stencils.get(element);
            if (undefined !== stencil) {
                stencil.deactivate();
            }
        });
        fieldset.disabled = false;
        preview.transport.play();
        stencil.activate();
        element.setAttribute("active", "true");
        model.deserialize(stencil.model.serialize());
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