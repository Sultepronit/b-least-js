import { Chart } from "chart.js";
import ChartBase from "./chartBase";

const errorBarsPlugin = {
    id: "errorBars",
    beforeDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        const dataset = chart.data.datasets[12];
        if (!dataset || !dataset.data) return;

        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        // Проходимо по кожній точці циклом
        dataset.data.forEach(pt => {
            if (pt.Uy && pt.Ux) {
                const pixelX = xAxis.getPixelForValue(pt.x);
                const pixelYTop = yAxis.getPixelForValue(pt.y + pt.Uy);
                const pixelYBottom = yAxis.getPixelForValue(pt.y - pt.Uy);

                const pixelY = yAxis.getPixelForValue(pt.y);
                const pixelXLeft = xAxis.getPixelForValue(pt.x - pt.Ux);
                const pixelXRight = xAxis.getPixelForValue(pt.x + pt.Ux);

                // y!
                ctx.beginPath();
                ctx.moveTo(pixelX, pixelYTop);
                ctx.lineTo(pixelX, pixelYBottom);
                ctx.stroke();

                // const capSizeX = pixelY - pixelXLeft;
                const capSizeX = (pixelXRight - pixelXLeft) / 10;
                // console.log(pixelY, pixelXLeft);
                ctx.beginPath();
                ctx.moveTo(pixelX - capSizeX, pixelYTop);
                ctx.lineTo(pixelX + capSizeX, pixelYTop);
                ctx.moveTo(pixelX - capSizeX, pixelYBottom);
                ctx.lineTo(pixelX + capSizeX, pixelYBottom);
                ctx.stroke();

                // x!
                ctx.beginPath();
                ctx.moveTo(pixelXRight, pixelY);
                ctx.lineTo(pixelXLeft, pixelY);
                ctx.stroke();

                // const capSizeY = pixelX - pixelYBottom;
                const capSizeY = (pixelYTop - pixelYBottom) / 10;
                // console.log(pixelX, pixelYBottom);
                ctx.beginPath();
                ctx.moveTo(pixelXLeft, pixelY - capSizeY);
                ctx.lineTo(pixelXLeft, pixelY + capSizeY);
                ctx.moveTo(pixelXRight, pixelY - capSizeY);
                ctx.lineTo(pixelXRight, pixelY + capSizeY);
                ctx.stroke();
            }
        });

        ctx.restore();
    },
};

class ZoomChart extends ChartBase {
    U = { x: 0, y: 0 };
    constructor() {
        super();
        this.canvas = document.getElementById("chart-2");
    }

    build(maxUx, maxUy) {
        this.U.x = maxUx;
        this.U.y = maxUy;

        this.chart = new Chart(this.canvas, {
            type: "scatter",
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
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
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "xy",
                            modifierKey: null,
                            threshold: 10,
                        },
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                        },
                    },
                },
                scales: {
                    x: {
                        max: this.U.x * 20,
                        ticks: {
                            font: {
                                size: 16,
                            },
                        },
                    },
                    y: {
                        max: this.U.y * 20,
                        position: "left",
                        ticks: {
                            font: {
                                size: 16,
                            },
                            // maxTicksLimit: 20,
                            callback: function (value) {
                                if (Math.abs(value) > 1000) {
                                    return value.toExponential(3);
                                }
                                return value.toLocaleString();
                            },
                        },
                    },
                },
            },
            plugins: [errorBarsPlugin],
            data: this.data,
        });
    }

    updateZoomedView(pointData) {
        const Ux = pointData.Ux ?? this.U.x;
        this.chart.options.scales.x.min = pointData.x - Ux;
        this.chart.options.scales.x.max = pointData.x + Ux;

        const Uy = pointData.Uy ?? this.U.y;
        this.chart.options.scales.y.min = pointData.y - Uy;
        this.chart.options.scales.y.max = pointData.y + Uy;

        this.chart.update("none");
    }
}

const zoomChart = new ZoomChart();
export default zoomChart;
