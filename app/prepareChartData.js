import getFit from "./b-least";
import buildChart, { addDataset } from "./chart";
import buildChart2, { addDataset2 } from "./chart2";
import { get10723 } from "./iso10723";

function fn(args, x) {
    return args[0] + args[1] * x + args[2] * x ** 2 + args[3] * x ** 3;
}

function presentFn(inputData, order) {
    const fitData = getFit(inputData, order);
    console.log(fitData);
    const args = fitData[0];
    const x_ = fitData[3];
    const maxX = Math.max(...inputData.x);
    let min = Math.min(...inputData.x) - maxX * 0.02;
    if (min < 0) min = 0;
    let max = maxX * 1.02;
    if (max > 100) max = 100;

    const steps = 100;
    const step = (max - min) / steps;
    const line = [];
    for (let i = 0; i <= steps; i++) {
        const x = min + i * step;
        line.push({
            x,
            y: fn(args, x),
        });
    }
    // console.log(line);
    const corr = x_.map(x => ({ x, y: fn(args, x) }));
    // return line;
    return { line, corr };
}

export default function prepareChartData(setNumber = 0) {
    const inputData = get10723(setNumber);
    console.log(inputData);

    const fns = [];
    for (let i = 1; i <= 3; i++) {
        fns.push(presentFn(inputData, i));
    }

    const expDots = [];
    for (let i = 0; i < inputData.x.length; i++) {
        for (let j = 0; j < inputData.responses[0].length; j++) {
            if (!expDots[j]) expDots[j] = [];
            expDots[j][i] = { x: inputData.x[i], y: inputData.responses[i][j] };
        }
    }

    const y = inputData.x.map((x, i) => ({
        x,
        y: inputData.y[i],
        Uy: inputData.uy[i] * 2,
        Ux: inputData.ux[i] * 2,
    }));

    const maxU = {
        x: Math.max(...inputData.ux) * 2,
        y: Math.max(...inputData.uy) * 2,
    };

    return { fns, expDots, y, maxU };
}
