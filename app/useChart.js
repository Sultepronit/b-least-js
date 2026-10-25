import getFit from "./b-least";
import buildChart, { addDataset } from "./chart";
import buildChart2, { addDataset2 } from "./chart2";
import { get10723 } from "./iso10723";

function fn(args, x) {
    return args[0] + args[1] * x + args[2] * x ** 2 + args[3] * x ** 3;
}

function useFunction(inputData, order) {
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

function addToBoth(...args) {
    addDataset(...args);
    addDataset2(...args);
}

export default function useChart() {
    const inputData = get10723(2);
    console.log(inputData);

    const expDots = [];
    for (let i = 0; i < inputData.x.length; i++) {
        for (let j = 0; j < inputData.responses[0].length; j++) {
            if (!expDots[j]) expDots[j] = [];
            expDots[j][i] = { x: inputData.x[i], y: inputData.responses[i][j] };
        }
    }

    for (let i = 0; i < expDots.length; i++) {
        addToBoth({
            label: `y${i + 1}`,
            data: expDots[i],
            pointStyle: "circle",
            color: "red",
            fill: true,
            radius: 2,
        });
    }

    console.log(expDots);

    const dots = inputData.x.map((x, i) => ({
        x,
        y: inputData.y[i],
        Uy: inputData.uy[i] * 2,
        Ux: inputData.ux[i] * 2,
    }));
    // addToBoth({ label: "y", data: dots, pointStyle: "circle", color: "black", width: 2 })
    addToBoth({
        label: "y",
        data: dots,
        pointStyle: "circle",
        color: "black",
        // width: 2,
        // radius: 6,
        fill: true,
        radius: 3,
    });

    const fn1 = useFunction(inputData, 1);
    addToBoth({ label: "fn1", data: fn1.line, color: "green", width: 1 });
    addToBoth({
        label: "fn1",
        data: fn1.corr,
        pointStyle: "crossRot",
        color: "green",
        width: 2,
        radius: 5,
    });

    const fn2 = useFunction(inputData, 2);
    addToBoth({ label: "fn2", data: fn2.line, color: "blue", width: 1 });
    addToBoth({
        label: "fn2",
        data: fn2.corr,
        pointStyle: "crossRot",
        color: "blue",
        width: 2,
        radius: 5,
    });

    const fn3 = useFunction(inputData, 3);
    addToBoth({ label: "fn3", data: fn3.line, color: "purple", width: 2 });
    addToBoth({
        label: "fn3",
        data: fn3.corr,
        pointStyle: "crossRot",
        color: "purple",
        width: 2,
        radius: 5,
    });

    const maxUx = Math.max(...inputData.ux) * 2;
    const maxUy = Math.max(...inputData.uy) * 2;
    console.log(maxUx, maxUy);

    buildChart();
    buildChart2(maxUx, maxUy);
}
