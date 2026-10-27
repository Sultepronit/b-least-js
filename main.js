import "./style/main.css";

import { test1 } from "./app/try4.js";
import useChart from "./app/useChart.js";
import buildCharts from "./app/buildCharts.js";
import updateCharts from "./app/updateCharts.js";

// test1()

// useChart()
buildCharts();

document.getElementById("examples").addEventListener("change", e => {
    console.log(e);
    console.log(e.target.value);
    updateCharts(e.target.value);
});
