import getFit from "./b-least"
import buildChart, { addDataset } from "./chart"
import buildChart2, { addDataset2 } from "./chart2"
import { get10723 } from "./iso10723"

function useFunction(inputData, order) {
    const fitData = getFit(inputData, order)
    console.log(fitData)
    const args = fitData[0]
    const maxX = Math.max(...inputData.x)
    let min = Math.min(...inputData.x) - maxX * 0.02
    if (min < 0) min = 0
    let max = maxX * 1.02
    if (max > 100) max = 100

    const steps = 100
    const step = (max - min) / steps
    const re = []
    for (let i = 0; i <= steps; i++) {
        const x = min + i * step
        re.push({
            x,
            y: args[0] + args[1] * x + args[2] * x ** 2 + args[3] * x ** 3,
        })
    }
    console.log(re)
    return re
}

function addToBoth(...args) {
    addDataset(...args)
    addDataset2(...args)
}

export default function useChart() {
    const inputData = get10723(3)
    console.log(inputData)

    const expDots = []
    for (let i = 0; i < inputData.x.length; i++) {
        for (let j = 0; j < inputData.responses[0].length; j++) {
            if (!expDots[j]) expDots[j] = []
            expDots[j][i] = { x: inputData.x[i], y: inputData.responses[i][j] }
        }
    }

    console.log(expDots)

    const dots = inputData.x.map((x, i) => ({
        x,
        y: inputData.y[i],
        yErr: inputData.uy[i] * 2,
        Ux: inputData.ux[i] * 2,
    }))
    // addToBoth({ label: "y", data: dots, pointStyle: "circle", color: "black", width: 2 })
    addToBoth({
        label: "y",
        data: dots,
        pointStyle: "circle",
        color: "black",
        width: 2,
        // radius: 6,
    })

    // for (const sample of expDots) {
    for (let i = 0; i < expDots.length; i++) {
        // addDataset({
        addToBoth({
            label: `y${i + 1}`,
            data: expDots[i],
            pointStyle: "circle",
            color: "red",
            fill: true,
            radius: 2,
        })
    }

    const fn1 = useFunction(inputData, 1)
    addToBoth({ label: "fn1", data: fn1, color: "green", width: 1 })

    const fn2 = useFunction(inputData, 2)
    addToBoth({ label: "fn2", data: fn2, color: "blue", width: 1 })

    const fn3 = useFunction(inputData, 3)
    addToBoth({ label: "fn3", data: fn3, color: "purple", width: 1 })

    const maxUx = Math.max(...inputData.ux) * 2
    const maxUy = Math.max(...inputData.uy) * 2
    console.log(maxUx, maxUy)

    buildChart()
    buildChart2(maxUx, maxUy)
}
