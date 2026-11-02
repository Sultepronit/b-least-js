import { Chart } from "chart.js";

// import { updateZoomedView } from "./chart2";
import ChartBase from "./chartBase";
import zoomChart from "./zoomChart";

class MainChart extends ChartBase {
    constructor() {
        super();
        this.canvas = document.getElementById("chart");
    }

    build() {
        // const data = this.data;
        // const canvas = this.canvas;
        this.chart = new Chart(this.canvas, {
            type: "scatter",
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                        // align: "end",
                        // labels: {
                        //     boxWidth: 16,
                        //     font: {
                        //         size: 16,
                        //     },
                        // },
                    },
                    tooltip: {
                        titleFont: {
                            size: 16,
                        },
                        bodyFont: {
                            size: 16,
                        },
                        filter: item => {
                            return !item.dataset.label.startsWith("(");
                        },
                        callbacks: {
                            label: item => {
                                // console.log(item);
                                // console.log(item.dataset.label);
                                const label = item.dataset.label;
                                // let x = item.parsed.x;
                                // let y = item.parsed.y;
                                const x = item.parsed.x.toPrecision(4);
                                const y = item.parsed.y.toPrecision(6);

                                // if (item.dataset.label.startsWith("f")) {
                                //     x = x.toFixed(4);
                                //     y = y.toPrecision(6);
                                // }

                                return `${label}: (${x}; ${y})`;
                            },
                        },
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
                        // suggestedMin: 0,
                        // suggestedMax: 100,
                        // min: 0,
                        // max: 100,
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
                            // maxTicksLimit: 20,
                            callback: function (value) {
                                // console.log(value);
                                // console.log(this.ticks);
                                // if (Math.abs(value) > 1000) {
                                //     return value.toExponential(2);
                                // }
                                // return value.toLocaleString();
                                return this.chart._yTicks?.[value] ?? value;
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

                        const datasetIndex = element.datasetIndex;
                        const index = element.index;

                        const pointData = chart.data.datasets[datasetIndex].data[index];

                        zoomChart.updateZoomedView(pointData);
                    }
                },
            },
            plugins: [this.precalculateYTicks],
            data: this.data,
        });
    }
}

const mainChart = new MainChart();
export default mainChart;
