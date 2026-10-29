import mainChart from "./chart";
import zoomChart from "./chart2";

import prepareChartData from "./prepareChartData";

export default function updateView(setNumber, type) {
    const data = prepareChartData(setNumber, type === "analysis" ? "x" : "y");

    mainChart.update(data);
    zoomChart.update(data);
}
