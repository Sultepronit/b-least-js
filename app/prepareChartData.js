import getFit from "./b-least";
import fillResultsTable from "./fillResultsTable";
import { get10723 } from "./iso10723";

function fn(args, x) {
    return args[0] + args[1] * x + args[2] * x ** 2 + args[3] * x ** 3;
}

function presentFn(inputData, order, type) {
    const fitData = getFit(inputData, order, type);
    console.log(fitData);

    const args = fitData.a;

    const [xy, yx] = type === "x" ? ["x", "y"] : ["y", "x"];

    let max = Math.max(...inputData[xy]);
    let min = Math.min(...inputData[xy]) - max * 0.02;
    max = max * 1.02;
    if (xy === "x") {
        if (min < 0) min = 0;
        if (max > 100) max = 100;
    }

    const steps = 100;
    const step = (max - min) / steps;
    const line = [];
    for (let i = 0; i <= steps; i++) {
        const x = min + i * step;
        const y = fn(args, x);
        // if (xy === "y" && y < 0) continue;
        line.push({
            [xy]: x,
            [yx]: y,
        });
    }

    const corr = fitData.x_.map(x => ({ [xy]: x, [yx]: fn(args, x) }));

    return { line, corr, results: fitData };
}

export default function prepareChartData(setNumber, type = "x") {
    const inputData = get10723(setNumber);
    console.log(inputData);

    const fns = [];
    for (let i = 1; i <= 3; i++) {
        fns.push(presentFn(inputData, i, type));
    }

    fillResultsTable(fns, type);

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
