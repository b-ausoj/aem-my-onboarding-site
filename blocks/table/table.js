/**
 * Table block: renders an authored div-grid as a real, accessible <table>.
 * The first row is the header (<th scope="col">); the first cell of each
 * body row becomes a row header (<th scope="row">).
 *
 * Authored structure (every row has the same number of cells):
 *   <div class="table">
 *     <div><div>Aspect</div><div>Bivouac</div><div>Camping</div></div>
 *     <div><div>Duration</div><div>One night</div><div>Several</div></div>
 *   </div>
 *
 * @param {Element} block The table block element
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);

  [...block.children].forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell, colIndex) => {
      const isHeaderRow = rowIndex === 0;
      const isRowHeader = !isHeaderRow && colIndex === 0;
      const el = document.createElement(isHeaderRow || isRowHeader ? 'th' : 'td');
      if (isHeaderRow) el.setAttribute('scope', 'col');
      else if (isRowHeader) el.setAttribute('scope', 'row');
      el.innerHTML = cell.innerHTML;
      tr.append(el);
    });
    (rowIndex === 0 ? thead : tbody).append(tr);
  });

  block.replaceChildren(table);
}
