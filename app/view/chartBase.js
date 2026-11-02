import {
    Chart,
    // Legend,
    LinearScale,
    LineElement,
    PointElement,
    ScatterController,
    Tooltip,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { determineOrder } from "../helpers";

Chart.register(
    ScatterController,
    PointElement,
    LinearScale,
    LineElement,
    // Legend,
    Tooltip,
    zoomPlugin,
);

export default class ChartBase {
    data = { datasets: [] };
    chart = null;
    canvas = null;
    ticksCache = [];
    // expOrder = 0;

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
        this.chart.data.datasets[0].data = fns?.[2]?.line;
        this.chart.data.datasets[1].data = fns?.[2]?.corr;
        this.chart.data.datasets[2].data = fns?.[1]?.line;
        this.chart.data.datasets[3].data = fns?.[1]?.corr;
        this.chart.data.datasets[4].data = fns?.[0]?.line;
        this.chart.data.datasets[5].data = fns?.[0]?.corr;
        // for (let i = 0; i < expDots.length; i++) {
        for (let i = 0; i < 6; i++) {
            this.chart.data.datasets[6 + i].data = expDots[i];
            // console.log(expDots[i]);
        }
        this.chart.data.datasets[12].data = y;

        this.setMaxU && this.setMaxU(maxU);

        this.chart.update();
    }

    sets = {
        f1: [4, 5],
        f2: [2, 3],
        f3: [0, 1],
        adjusted: [1, 3, 5],
        experimental: [12],
        responses: [6, 7, 8, 9, 10, 11],
        showU: true,
        excludedF: new Set(),
        adjAreExcluded: false,
    };

    toggleDataset(setName, visible) {
        if (setName === "uncertainties") {
            this.sets.showU = visible;
            this.chart.update();
            return;
        }

        if (setName.startsWith("f")) {
            if (visible) this.sets.excludedF.delete(this.sets[setName][1]);
            else this.sets.excludedF.add(this.sets[setName][1]);
        } else if (setName === "adjusted") {
            this.sets.adjAreExcluded = !visible;
        }

        for (const n of this.sets[setName]) {
            if (setName === "adjusted" && visible && this.sets.excludedF.has(n)) continue;
            this.chart.setDatasetVisibility(n, visible);
            if (setName.startsWith("f") && this.sets.adjAreExcluded) break;
        }

        this.chart.update();
    }

    precalculateYTicks = {
        id: "precalculateYTicks",
        afterBuildTicks: chart => {
            if (
                this.ticksCache[0] === chart.scales.y.ticks[0].value &&
                this.ticksCache[1] === chart.scales.y.ticks[1].value
            ) {
                return;
            }

            this.ticksCache = chart.scales.y.ticks.map(({ value }) => value);

            const order = determineOrder(this.ticksCache, true);

            chart._yTicks = {};
            for (const t of this.ticksCache) {
                chart._yTicks[t] = t === 0 ? 0 : t.toExponential(order);
            }
            // console.log(chart._yTicks);
        },
    };
}
