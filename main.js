import "./style/main.css";

import buildCharts from "./app/buildCharts.js";
import updateView from "./app/updateView.js";

buildCharts();

// document.getElementById("examples").addEventListener("change", e => {
//     updateView(e.target.value);
// });

const controls = document.getElementById("controls");
controls.addEventListener("change", e => {
    console.log(e);
    // console.log(e.target.value);
    console.log(controls.examples.value, controls.type.value);
    updateView(controls.examples.value, controls.type.value);
});
