export function getScaleFactor(data) {
    const maxAbs = Math.max(...data.map(Math.abs))
    const power = Math.floor(Math.log10(maxAbs))
    return 10 ** power
}

export function scaleData(data) {
    const f = getScaleFactor(data)
    return {
        scale: f,
        scaled: data.map(e => e / f),
    }
}
