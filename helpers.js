export function calculateAverage(values) {
    return values.reduce((acc, val) => acc + Number(val), 0) / values.length
}

export function calculate_s(values, average) {
    let sum = 0
    if (!average) average = calculateAverage(values)
    for (const val of values) {
        sum += Math.pow(average - val, 2)
    }
    return Math.sqrt(sum / (values.length - 1))
}

export function getScaleFactor(data) {
    // const maxAbs = Math.max(...data.map(Math.abs))
    // const power = Math.floor(Math.log10(maxAbs))
    // const power = Math.floor(Math.log10(Math.abs(data[0])))
    const mean = Math.abs(calculateAverage(data)) || 1
    // console.log(mean)
    const power = Math.floor(Math.log10(mean))
    return 10 ** power
}
