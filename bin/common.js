var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getChromeVersion } from "./dom/common.js";
export const install = () => __awaiter(void 0, void 0, void 0, function* () {
    const showError = (message) => {
        const preloader = document.getElementById("preloader");
        if (null === preloader) {
            alert(message);
        }
        else {
            preloader.innerHTML = `<span style="color: #F33">${message}</span>`;
        }
    };
    window.onerror = (message) => {
        showError(message);
        return true;
    };
    window.onunhandledrejection = (event) => {
        if (event.reason instanceof Error) {
            showError(event.reason.message);
        }
        else {
            showError(event.reason);
        }
    };
    const chromeVersion = getChromeVersion();
    if (!chromeVersion || chromeVersion < 97) {
        throw new Error("Use latest Chrome browser.");
    }
    return Promise.resolve();
});
//# sourceMappingURL=common.js.map