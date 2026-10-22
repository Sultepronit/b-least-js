import { calculateAverage } from "./iso10723"

export function getScaleFactor(data) {
    // const maxAbs = Math.max(...data.map(Math.abs))
    // const power = Math.floor(Math.log10(maxAbs))
    // const power = Math.floor(Math.log10(Math.abs(data[0])))
    const mean = Math.abs(calculateAverage(data)) || 1
    console.log(mean)
    const power = Math.floor(Math.log10(mean))
    return 10 ** power
}

// export function scaleData(data) {
//     const f = getScaleFactor(data)
//     return {
//         scale: f,
//         scaled: data.map(e => e / f),
//     }
// }
