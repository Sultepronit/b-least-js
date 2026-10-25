import {
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    ScatterController,
    Tooltip,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { updateZoomedView } from "./chart2";

const chartData = {
    datasets: [],
};
const canvas = document.getElementById("chart");
let chart = null;

export function addDataset({ label, data, pointStyle, width, color, fill = false, radius = 5 }) {
    console.log(chartData);
    chartData.datasets.push({
        label,
        data,
        borderWidth: width,
        borderColor: color,
        // fill: !!backgroundColor,
        backgroundColor: "white",
        pointStyle: pointStyle,
        pointRadius: pointStyle ? radius : 0,
        pointBorderWidth: width || 1,
        pointBackgroundColor: fill ? color : "#ffffff00",
        showLine: !pointStyle,
    });
}

const errorBarsPlugin = {
    id: "errorBars",
    afterDraw(chart) {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        // Беремо дані з потрібного нам датасету (наприклад, першого експериментального)
        const dataset = chart.data.datasets[0];
        if (!dataset || !dataset.data) return;

        ctx.save();
        ctx.strokeStyle = "#000"; // Насичений червоний колір для хрестів
        ctx.lineWidth = 1;

        // Проходимо по кожній точці циклом
        dataset.data.forEach(pt => {
            // Перевіряємо, чи взагалі задана похибка для цієї точки
            if (pt.yErr !== undefined && pt.yErr > 0) {
                // Переводимо математичні координати у пікселі canvas
                const pixelX = xAxis.getPixelForValue(pt.x);
                const pixelYTop = yAxis.getPixelForValue(pt.y + pt.yErr);
                const pixelYBottom = yAxis.getPixelForValue(pt.y - pt.yErr);

                // 1. Малюємо вертикальну паличку невизначеності
                ctx.beginPath();
                ctx.moveTo(pixelX, pixelYTop);
                ctx.lineTo(pixelX, pixelYBottom);
                ctx.stroke();

                // // 2. Малюємо горизонтальні «вусики» (шапочки) на кінцях
                // const capSize = 4 // ширина вусиків у пікселях

                // ctx.beginPath()
                // // Верхній вусик
                // ctx.moveTo(pixelX - capSize, pixelYTop)
                // ctx.lineTo(pixelX + capSize, pixelYTop)
                // // Нижній вусик
                // ctx.moveTo(pixelX - capSize, pixelYBottom)
                // ctx.lineTo(pixelX + capSize, pixelYBottom)
                // ctx.stroke()
            }

            if (pt.Ux) {
                const pixelY = yAxis.getPixelForValue(pt.y);
                const pixelXLeft = xAxis.getPixelForValue(pt.x - pt.Ux);
                const pixelXRight = xAxis.getPixelForValue(pt.x + pt.Ux);

                ctx.beginPath();
                ctx.moveTo(pixelXRight, pixelY);
                ctx.lineTo(pixelXLeft, pixelY);
                ctx.stroke();
            }
        });

        ctx.restore();
    },
};

// І просто передаємо цей плагін у конфігурацію chart:
// plugins: [errorBarsPlugin]

export default function buildChart() {
    Chart.register(
        ScatterController,
        // LineController,
        PointElement,
        // CategoryScale,
        LinearScale,
        LineElement,
        Legend,
        Tooltip,
        // Filler,
    );

    Chart.register(zoomPlugin);

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
                    const di = 6;
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
}
