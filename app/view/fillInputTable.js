const tbody = document.getElementById("input-tbody");

function fillResponses(data, i) {
    if (!data.responses) return "";
    return data.responses[i].map(r => `<td>${r}</td>`).join("");
}

let lastSetName = "";
export default function fillInputTable(data) {
    if (lastSetName === data.name) return;
    lastSetName = data.name;

    tbody.innerHTML =
        `<tr>
    <th>x</th><th>u(x)</th><th>y</th><th>u(y)</th>
    ${data.responses ? `<th class="left" colspan=${data.responses.length}>responses</th>` : ""}
</tr>` +
        data.x
            .map((x, i) => {
                return `<tr>
    <td>${x}</td>
    <td>${data.ux[i]}</td>
    <td>${data.y[i].toExponential(3)}</td>
    <td>${data.uy[i].toExponential(3)}</td>
    ${fillResponses(data, i)}
</tr>`;
            })
            .join("");
}
