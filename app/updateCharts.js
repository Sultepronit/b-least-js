// import buildChart, { addDataset, updateChart } from "./chart";
import mainChart from "./chart";
import zoomChart from "./chart2";
// import { updateChart2 } from "./chart2";

import prepareChartData from "./prepareChartData";

export default function updateCharts(setNumber) {
    const data = prepareChartData(setNumber);

    mainChart.update(data);
    // updateChart2(data);
    zoomChart.update(data);
}
