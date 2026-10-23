import getFit from "./b-least"
import buildChart, { addDataset } from "./chart"
import { get10723 } from "./iso10723"

function useFunction(inputData) {
    const fitData = getFit(inputData, 3)
    console.log(fitData)
    const args = fitData[0]
    const min = Math.min(...inputData.x) * 0.95
    const max = Math.max(...inputData.x) * 1.05
    const steps = 100
    const step = (max - min) / steps
    const re = []
    for (let i = 0; i < steps; i++) {
        const x = min + i * step
        re.push({
            x,
            y: args[0] + args[1] * x + args[2] * x ** 2 + args[3] * x ** 3,
        })
    }
    console.log(re)
    return re
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
    addDataset({ label: "y", data: dots, pointStyle: "cross", color: "black", width: 2 })

    for (const sample of expDots) {
        addDataset({
            label: "exp",
            data: sample,
            pointStyle: "circle",
            color: "red",
            fill: true,
            radius: 3,
        })
    }

    const fn = useFunction(inputData)
    addDataset({ label: "fn", data: fn, color: "gray", width: 3 })

    buildChart()
}
