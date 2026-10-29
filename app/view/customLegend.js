import mainChart from "./mainChart";
import zoomChart from "./zoomChart";

const form = document.getElementById("legend");

export default function setLegend() {
    form.addEventListener("change", e => {
        // console.log(e.target);
        mainChart.toggleDataset(e.target.name, e.target.checked);
        zoomChart.toggleDataset(e.target.name, e.target.checked);
    });
}
