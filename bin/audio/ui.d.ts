import { UIControllerLayout } from "../dom/controls.js";
import { CompositeSettings } from "./composite.js";
import { NoArgType } from "../lib/common.js";
export declare const SettingsControlBuilder: {
    availableTypes: Map<string, NoArgType<CompositeSettings<any>>>;
    build(layout: UIControllerLayout, settings: CompositeSettings<any>): void;
};
