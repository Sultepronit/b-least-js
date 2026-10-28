import "./style/main.css";

import buildCharts from "./app/buildCharts.js";
import updateCharts from "./app/updateCharts.js";

buildCharts();

document.getElementById("examples").addEventListener("change", e => {
    updateCharts(e.target.value);
});
