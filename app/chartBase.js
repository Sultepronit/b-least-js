import {
    Chart,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    ScatterController,
    Tooltip,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(
    ScatterController,
    PointElement,
    LinearScale,
    LineElement,
    Legend,
    Tooltip,
    zoomPlugin,
);

export default class ChartBase {
    data = { datasets: [] };
    chart = null;
    canvas = null;

    addDataset({ label, data, pointStyle, width, color, fill = false, radius = 5 }) {
        this.data.datasets.push({
            label,
            data,
            borderWidth: width,
            borderColor: color,
            backgroundColor: "white",
            pointStyle: pointStyle,
            pointRadius: pointStyle ? radius : 0,
            pointBorderWidth: width || 1,
            pointBackgroundColor: fill ? color : "#ffffff00",
            showLine: !pointStyle,
        });
    }

    update({ fns, expDots, y, maxU }) {
        this.chart.data.datasets[0].data = fns[2].line;
        this.chart.data.datasets[1].data = fns[2].corr;
        this.chart.data.datasets[2].data = fns[1].line;
        this.chart.data.datasets[3].data = fns[1].corr;
        this.chart.data.datasets[4].data = fns[0].line;
        this.chart.data.datasets[5].data = fns[0].corr;
        for (let i = 0; i < expDots.length; i++) {
            this.chart.data.datasets[6 + i].data = expDots[i];
        }
        this.chart.data.datasets[12].data = y;
        this.chart.update();
    }
}
