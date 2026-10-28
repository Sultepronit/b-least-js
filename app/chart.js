import { Chart } from "chart.js";

import { updateZoomedView } from "./chart2";
import ChartBase from "./chartBase";

class MainChart extends ChartBase {
    constructor() {
        super();
        this.canvas = document.getElementById("chart");
    }

    build() {
        const data = this.data;
        const canvas = this.canvas;
        this.chart = new Chart(canvas, {
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
            data,
        });

        console.log(chart.data);
    }
}

const mainChart = new MainChart();
export default mainChart;
