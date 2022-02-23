import {getChromeVersion} from "./dom/common.js"

export const install = async () => {
    const showError = (message: string) => {
        const preloader = document.getElementById("preloader")
        if (null === preloader) {
            alert(message)
        } else {
            preloader.innerHTML = `<span style="color: #F33">${message}</span>`
        }
    }
    window.onerror = (message: string) => {
        showError(message)
        return true
    }
    window.onunhandledrejection = (event) => {
        if (event.reason instanceof Error) {
            showError(event.reason.message)
        } else {
            showError(event.reason)
        }
    }
    const chromeVersion = getChromeVersion()
    if (!chromeVersion || chromeVersion < 97) {
        throw new Error("Use latest Chrome browser.")
    }
    return Promise.resolve()
}