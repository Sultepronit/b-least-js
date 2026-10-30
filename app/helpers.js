export function calculateAverage(values) {
    return values.reduce((acc, val) => acc + Number(val), 0) / values.length;
}

export function calculate_s(values, average) {
    let sum = 0;
    if (!average) average = calculateAverage(values);
    for (const val of values) {
        sum += Math.pow(average - val, 2);
    }
    return Math.sqrt(sum / (values.length - 1));
}

export function getScaleFactor(data) {
    // const maxAbs = Math.max(...data.map(Math.abs))
    // const power = Math.floor(Math.log10(maxAbs))
    // const power = Math.floor(Math.log10(Math.abs(data[0])))
    const mean = Math.abs(calculateAverage(data)) || 1;
    // console.log(mean)
    const power = Math.floor(Math.log10(mean));
    return 10 ** power;
}

export function determineOrder(numbers, areSorted = false) {
    const sorted = areSorted ? numbers : [...numbers].sort((a, b) => a - b);
    // console.log(sorted);
    let minProportion = Infinity;
    for (let i = 1; i < sorted.length; i++) {
        const prop = sorted[i] / sorted[i - 1];
        if (prop < minProportion) minProportion = prop;
    }

    // console.log(minProportion);
    // console.log(Math.log10(minProportion - 1));
    // const o2 = Math.floor(Math.log10(minProportion - 1) * -1);
    // const o2 = Math.log10(minProportion - 1) * -1;
    // const o2 = Math.round(Math.log10(minProportion - 1) * -1);
    const o2 = Math.ceil(Math.log10(minProportion - 1) * -1);

    // sorted.forEach(e => {
    //     console.log(e.toExponential(o2));
    // });

    return o2;
}
