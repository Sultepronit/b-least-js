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
} from "chart.js"

const chartData = {
    datasets: [],
}
const canvas = document.getElementById("chart-2")
let chart = null
const uxy = {}

export function addDataset2({ label, data, pointStyle, width, color, fill = false, radius = 5 }) {
    console.log(chartData)
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
    })
}

const errorBarsPlugin = {
    id: "errorBars",
    afterDraw(chart) {
        const ctx = chart.ctx
        const xAxis = chart.scales.x
        const yAxis = chart.scales.y

        // Беремо дані з потрібного нам датасету (наприклад, першого експериментального)
        const dataset = chart.data.datasets[0]
        if (!dataset || !dataset.data) return

        ctx.save()
        ctx.strokeStyle = "orange"
        ctx.lineWidth = 1

        // Проходимо по кожній точці циклом
        dataset.data.forEach(pt => {
            // Перевіряємо, чи взагалі задана похибка для цієї точки
            if (pt.yErr !== undefined && pt.yErr > 0) {
                // Переводимо математичні координати у пікселі canvas
                const pixelX = xAxis.getPixelForValue(pt.x)
                const pixelYTop = yAxis.getPixelForValue(pt.y + pt.yErr)
                const pixelYBottom = yAxis.getPixelForValue(pt.y - pt.yErr)

                // 1. Малюємо вертикальну паличку невизначеності
                ctx.beginPath()
                ctx.moveTo(pixelX, pixelYTop)
                ctx.lineTo(pixelX, pixelYBottom)
                ctx.stroke()

                // 2. Малюємо горизонтальні «вусики» (шапочки) на кінцях
                const capSize = 4 // ширина вусиків у пікселях

                ctx.beginPath()
                // Верхній вусик
                ctx.moveTo(pixelX - capSize, pixelYTop)
                ctx.lineTo(pixelX + capSize, pixelYTop)
                // Нижній вусик
                ctx.moveTo(pixelX - capSize, pixelYBottom)
                ctx.lineTo(pixelX + capSize, pixelYBottom)
                ctx.stroke()
            }

            if (pt.Ux) {
                const pixelY = yAxis.getPixelForValue(pt.y)
                const pixelXLeft = xAxis.getPixelForValue(pt.x - pt.Ux)
                const pixelXRight = xAxis.getPixelForValue(pt.x + pt.Ux)

                ctx.beginPath()
                ctx.moveTo(pixelXRight, pixelY)
                ctx.lineTo(pixelXLeft, pixelY)
                ctx.stroke()
            }
        })

        ctx.restore()
    },
}

export function updateZoomedView(x, y) {
    // Тут задаємо локальне вікно навколо знайденої точки (наприклад, ±0.05 по осі X)
    chart.options.scales.x.min = x - uxy.x
    chart.options.scales.x.max = x + uxy.x

    // Можна також точково підлаштувати вісь Y під значення у цій точці
    chart.options.scales.y.min = y - uxy.y
    chart.options.scales.y.max = y + uxy.y
    // console.log(x, y)
    // Перемальовуємо допоміжний графік без лагів
    chart.update("none")
}

export default function buildChart2(maxUx, maxUy) {
    uxy.x = maxUx
    uxy.y = maxUy
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
    )

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
                    max: uxy.x * 2,
                    ticks: {
                        font: {
                            size: 16,
                        },
                        // callback(val, index): string {
                        //     // const date = this.getLabelForValue(index)
                        //     const date = this.getLabelForValue(Number(val))
                        //     // console.log(val, index, date)
                        //     const [y, m, d] = date.split("-")
                        //     if (d === "11" || d === "21") return ""
                        //     if (d === "01")
                        //         return m === "01" ? y : formatUkDate(date, true, true)
                        //     return null
                        // },
                    },
                    // grid: {
                    //     color(context) {
                    //         return context.tick.label ? "#000" : "#0000003e"
                    //     },
                    // },
                },
                y: {
                    max: uxy.y * 2,
                    position: "right",
                    ticks: {
                        font: {
                            size: 16,
                        },
                        maxTicksLimit: 20,
                    },
                },
            },
        },
        // plugins: [errorBarsPlugin],
        data: chartData,
    })
}
