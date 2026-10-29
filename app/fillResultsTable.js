const tbody = document.getElementById("results-tbody");

function genFnRows(fnData, idx) {
    return `<tr>
    <th rowspan="2">f<sup>${idx + 1}</sup></th>
    <td>${fnData.S.toFixed(2)}</td>
    <td ${fnData.gamma > 2 ? `class="red b"` : ""}>${fnData.gamma.toFixed(2)}</td>
    <td>${fnData.a[0].toExponential(3)}</td>
    <td>${fnData.a[1].toExponential(3)}</td>
    <td>${fnData.a[2] ? fnData.a[2].toExponential(3) : ""}</td>
    <td>${fnData.a[3] ? fnData.a[3].toExponential(3) : ""}</td>
</tr>
<tr>
    
    <td colspan="2" class="right b i">u:</td>
    <td>${fnData.u[0].toExponential(3)}</td>
    <td>${fnData.u[1].toExponential(3)}</td>
    <td>${fnData.u[2]?.toExponential(3) ?? ""}</td>
    <td>${fnData.u[3]?.toExponential(3) ?? ""}</td>
</tr>`;
}

export default function fillResultsTable(data) {
    console.log(data);
    tbody.innerHTML =
        `<tr>
    <th></th><th>S<sub>res</sub></th><th>Γ</th>
    <th>a<sub>0</sub></th>
    <th>a<sub>1</sub></th>
    <th>a<sub>2</sub></th>
    <th>a<sub>3</sub></th>
</tr>` + data.map(({ results }, i) => genFnRows(results, i)).join("");
}
