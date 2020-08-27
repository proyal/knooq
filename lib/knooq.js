const esformatter = require('esformatter');
const fs = require('fs');
const toCamel = require('camel-case');
const toConst = require('constant-case');

const SUPPORTED_CLIENTS = ['mysql', 'mysql2', 'mssql'];

async function generate(configs) {
  if (!Array.isArray(configs)) {
    configs = [configs];
  }

  for (const config of configs) {
    console.log('Generating', config.output);
    if (!SUPPORTED_CLIENTS.includes(config.client)) {
      throw new Error(`Unsupported client. Try one of [${SUPPORTED_CLIENTS}]`);
    }

    let sql = await require(`./clients/${config.client}`)(config);

    let tables = await sql.getTableNames();

    let tableFunctionCode = [];
    for (let tableName of tables) {
      console.log('Generating', tableName);
      let columnNames = await sql.getColumnNamesForTable(tableName);
      tableFunctionCode.push({
        tableName,
        code: generateTableFunctionCode(tableName, columnNames),
      });
    }

    let source = generateCompleteSource(tableFunctionCode);
    source = esformatter.format(source);
    fs.writeFileSync(config.output, source, 'utf-8');
  }
}

function generateTableFunctionCode(table, columns) {
  return `
    function ${toConst(table)}(alias = '${table}') {
      let prefix = ''
      let asClause = ''
      if (alias && alias.length > 0) {
        prefix = alias + '.'
        asClause = ' as ' + alias
      }
      return {
        $name: '${table}',
        $as: '${table}' + asClause,
        ${columns.map(column => `${toCamel(column)}: prefix + '${column}'`)}
      }
    }
  `;
}

function generateCompleteSource(tableFunctionCode) {
  return `const TABLES = {
    ${tableFunctionCode.map(
      table => `${toConst(table.tableName)}: ${table.code}`).join(',\n')}
  }
  module.exports = {
    TABLES
  }
  `;
}

module.exports = generate;
