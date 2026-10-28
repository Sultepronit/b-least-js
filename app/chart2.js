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

const chartData = {
    datasets: [],
};
const canvas = document.getElementById("chart-2");
let chart = null;
const uxy = {};

export function addDataset2({ label, data, pointStyle, width, color, fill = false, radius = 5 }) {
    // console.log(chartData);
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

export function updateChart2({ fns, expDots, y, maxU }) {
    chart.data.datasets[0].data = fns[0].line;
    chart.data.datasets[1].data = fns[0].corr;
    chart.data.datasets[2].data = fns[1].line;
    chart.data.datasets[3].data = fns[1].corr;
    chart.data.datasets[4].data = fns[2].line;
    chart.data.datasets[5].data = fns[2].corr;
    for (let i = 0; i < expDots.length; i++) {
        chart.data.datasets[6 + i].data = expDots[i];
    }
    chart.data.datasets[12].data = y;
    chart.update();
}

const errorBarsPlugin = {
    id: "errorBars",
    // afterDraw(chart) {
    beforeDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        const dataset = chart.data.datasets[12];
        if (!dataset || !dataset.data) return;

        ctx.save();
        // ctx.strokeStyle = "#0005";
        // ctx.lineWidth = 1.5;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        // Проходимо по кожній точці циклом
        dataset.data.forEach(pt => {
            // console.log(pt);
            // Перевіряємо, чи взагалі задана похибка для цієї точки
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

export function updateZoomedView0(x, y) {
    chart.options.scales.x.min = x - uxy.x;
    chart.options.scales.x.max = x + uxy.x;

    chart.options.scales.y.min = y - uxy.y;
    chart.options.scales.y.max = y + uxy.y;

    chart.update("none");
}

export function updateZoomedView1(pointData) {
    chart.options.scales.x.min = pointData.x - pointData.Ux;
    chart.options.scales.x.max = pointData.x + pointData.Ux;

    chart.options.scales.y.min = pointData.y - pointData.Uy;
    chart.options.scales.y.max = pointData.y + pointData.Uy;

    chart.update("none");
}

export function updateZoomedView(pointData) {
    const Ux = pointData.Ux ?? uxy.x;
    chart.options.scales.x.min = pointData.x - Ux;
    chart.options.scales.x.max = pointData.x + Ux;

    const Uy = pointData.Uy ?? uxy.y;
    chart.options.scales.y.min = pointData.y - Uy;
    chart.options.scales.y.max = pointData.y + Uy;

    chart.update("none");
}

export default function buildChart2(maxUx, maxUy) {
    uxy.x = maxUx;
    uxy.y = maxUy;
    Chart.register(
        ScatterController,
        LineController,
        PointElement,
        CategoryScale,
        LinearScale,
        LineElement,
        Legend,
        Tooltip,
        Filler,
    );

    // Chart.register(zoomPlugin)

    chart = new Chart(canvas, {
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
                    max: uxy.x * 20,
                    ticks: {
                        font: {
                            size: 16,
                        },
                    },
                },
                y: {
                    max: uxy.y * 20,
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
        data: chartData,
    });
}
