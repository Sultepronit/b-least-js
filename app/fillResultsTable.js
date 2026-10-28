const tbody = document.getElementById("results-tbody");
export default function fillResultsTable(data) {
    tbody.innerHTML = `<tr>
    <th>*</th><th>S</th><th>Γ</th><th>a<sub>1</sub></th><th>a<sub>2</sub></th>
</tr>
<tr>
    <th>value</th>
    <td>${data.S.toFixed(2)}</td>
    <td>${data.gamma.toFixed(2)}</td>
    <td>${data.a[0]}</td>
    <td>${data.a[1]}</td>
</tr>`;
}
