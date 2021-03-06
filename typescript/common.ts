import {testFeatures} from "./dom/common.js"

export const install = async () => {
    const showError = (message: string) => {
        const preloader = document.getElementById("preloader")
        if (null === preloader) {
            alert(message)
        } else {
            preloader.innerHTML = `<span style="color: #F33">${message} (Try using Chrome)</span>`
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
    if (!await testFeatures()) {
        throw new Error("Your browser does not support all necessary web features")
    }
    return Promise.resolve()
}