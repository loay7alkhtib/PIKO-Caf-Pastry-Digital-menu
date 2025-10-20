const fs = require('fs');
const path = require('path');

function loadMenuJson() {
  const candidates = [
    path.resolve(__dirname, '..', 'public', 'static', 'menu.json'),
    path.resolve(__dirname, '..', 'src', 'piko_final_menu.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      // try next
    }
  }
  throw new Error(
    'Could not find menu.json in public/static or src/piko_final_menu.json'
  );
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function getCategoryNameById(categories, categoryId) {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return categoryId || '';
  return (
    (cat.names && (cat.names.en || cat.names.tr || cat.names.ar)) ||
    categoryId ||
    ''
  );
}

function buildRows(menu) {
  const categories = Array.isArray(menu.categories) ? menu.categories : [];
  const items = Array.isArray(menu.items) ? menu.items : [];

  const header = [
    'Category',
    'Item Name (EN)',
    'Item Name (TR)',
    'Item Name (AR)',
    'Base Price',
    'Variant Size',
    'Variant Price',
    'Tags',
  ];

  const rows = [header];
  for (const item of items) {
    const names = item.names || {};
    const baseRowCommon = [
      getCategoryNameById(categories, item.category_id),
      names.en || '',
      names.tr || '',
      names.ar || '',
      item.price != null ? item.price : '',
    ];
    const tagsStr = Array.isArray(item.tags) ? item.tags.join('|') : '';

    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const variant of item.variants) {
        rows.push([
          ...baseRowCommon,
          variant.size || '',
          variant.price != null ? variant.price : '',
          tagsStr,
        ]);
      }
    } else {
      rows.push([...baseRowCommon, '', '', tagsStr]);
    }
  }
  return rows;
}

function writeCsv(rows, outPath) {
  const lines = rows.map(cols => cols.map(escapeCsv).join(','));
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}

function main() {
  const menu = loadMenuJson();
  const rows = buildRows(menu);
  const outPath = path.resolve(__dirname, '..', 'menu-export.csv');
  writeCsv(rows, outPath);
  console.log('CSV exported to:', outPath);
}

if (require.main === module) {
  main();
}
