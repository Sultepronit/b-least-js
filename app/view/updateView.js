import mainChart from "./mainChart";
import zoomChart from "./zoomChart";

import prepareChartData from "../prepareChartData";

export default function updateView(setNumber, type) {
    const data = prepareChartData(setNumber, type === "analysis" ? "x" : "y");

    mainChart.update(data);
    zoomChart.update(data);
}
