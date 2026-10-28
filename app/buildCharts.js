// import buildChart, { addDataset } from "./chart";
import mainChart from "./chart";
import buildChart2, { addDataset2 } from "./chart2";
import prepareChartData from "./prepareChartData";

function addToBoth(...args) {
    mainChart.addDataset(...args);
    addDataset2(...args);
}

export default function buildCharts() {
    const { fns, expDots, y, maxU } = prepareChartData(0);

    addToBoth({ label: "fn1", data: fns[0].line, color: "green", width: 1 });
    addToBoth({
        label: "fn1",
        data: fns[0].corr,
        pointStyle: "crossRot",
        color: "green",
        width: 2,
        radius: 5,
    });

    addToBoth({ label: "fn2", data: fns[1].line, color: "blue", width: 1 });
    addToBoth({
        label: "fn2",
        data: fns[1].corr,
        pointStyle: "crossRot",
        color: "blue",
        width: 2,
        radius: 5,
    });

    addToBoth({ label: "fn3", data: fns[2].line, color: "purple", width: 1 });
    addToBoth({
        label: "fn3",
        data: fns[2].corr,
        pointStyle: "crossRot",
        color: "purple",
        width: 2,
        radius: 5,
    });

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

    addToBoth({
        label: "y",
        data: y,
        pointStyle: "circle",
        color: "black",
        // width: 2,
        // radius: 6,
        fill: true,
        radius: 3,
    });

    mainChart.build();
    buildChart2(maxU.x, maxU.y);
}
