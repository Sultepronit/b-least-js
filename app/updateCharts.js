// import buildChart, { addDataset, updateChart } from "./chart";
import { updateChart2 } from "./chart2";

import prepareChartData from "./prepareChartData";

export default function updateCharts(setNumber) {
    const data = prepareChartData(setNumber);

    updateChart(data);
    updateChart2(data);
}
