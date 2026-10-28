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
        this.chart.data.datasets[0].data = fns[0].line;
        this.chart.data.datasets[1].data = fns[0].corr;
        this.chart.data.datasets[2].data = fns[1].line;
        this.chart.data.datasets[3].data = fns[1].corr;
        this.chart.data.datasets[4].data = fns[2].line;
        this.chart.data.datasets[5].data = fns[2].corr;
        for (let i = 0; i < expDots.length; i++) {
            this.chart.data.datasets[6 + i].data = expDots[i];
        }
        this.chart.data.datasets[12].data = y;
        this.chart.update();
    }
}

export function buildChart() {
    chart = new Chart(canvas, {
        type: "scatter",
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    align: "end",
                    labels: {
                        boxWidth: 16,
                        font: {
                            size: 16,
                        },
                    },
                },
                tooltip: {
                    titleFont: {
                        size: 16,
                    },
                    bodyFont: {
                        size: 16,
                    },
                    // callbacks: {
                    //     title: function (context) {
                    //         return formatUkDate(context[0].label)
                    //     },
                    // },
                },
                // zoom: {
                //     pan: {
                //         enabled: true,
                //         mode: "xy",
                //         modifierKey: null,
                //         threshold: 10,
                //     },
                //     zoom: {
                //         wheel: { enabled: true },
                //         pinch: { enabled: true },
                //     },
                // },
            },
            scales: {
                x: {
                    // min: this.data.minX,
                    // max: this.data.maxX,
                    ticks: {
                        font: {
                            size: 16,
                        },
                        maxTicksLimit: 20,
                    },
                },
                y: {
                    position: "left",
                    ticks: {
                        font: {
                            size: 16,
                        },
                        maxTicksLimit: 20,
                        callback: function (value) {
                            if (Math.abs(value) > 1000) {
                                return value.toExponential(2);
                            }
                            return value.toLocaleString();
                        },
                    },
                },
            },
            onHover: (event, activeElements, chart) => {
                if (activeElements.length > 0) {
                    // const element = activeElements[0];
                    // console.log(activeElements);
                    const di = 12;
                    const element =
                        activeElements.find(e => e.datasetIndex === di) || activeElements[0];
                    // console.log(element);
                    // if (!element) return;
                    const datasetIndex = element.datasetIndex;
                    const index = element.index;

                    const pointData = chart.data.datasets[datasetIndex].data[index];
                    // const pointData = chart.data.datasets[di].data[index];
                    // console.log(pointData);

                    // const pointX = pointData.x;
                    // const pointY = pointData.y;

                    // updateZoomedView(pointX, pointY);
                    updateZoomedView(pointData);
                }
            },
        },
        // plugins: [errorBarsPlugin],
        data: chartData,
    });

    console.log(chart.data);
}
