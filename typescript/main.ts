import {LinearQuantizedValue} from "./common";

const a = new LinearQuantizedValue()
const s = a.addObserver(value => {
    console.log(value.get())
})
a.decrease()
a.decrease()
a.terminate()
a.decrease()
a.decrease()