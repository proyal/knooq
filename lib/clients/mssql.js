const url = require('url');

module.exports = async function createConnection(config) {
    let client;
    try {
        client = require('mssql');
    } catch (e) {
        throw new Error('Client dependency (mssql) not found. Run `npm install mssql`')
    }

    let connection = await client.connect(config.connection);
    const schemaName = getSchemaFromConfig(config);

    async function getTableNames() {
        let results = await connection.query(`SELECT table_name
                                              FROM information_schema.tables
                                              WHERE table_type = 'BASE TABLE' AND table_catalog = '${schemaName}'`);
        return results.recordset.map(r => r.table_name);
    }

    async function getColumnNamesForTable(tableName) {
        let results = await connection.query(`SELECT column_name
                                              FROM information_schema.columns
                                              WHERE table_catalog = '${schemaName}'
                                              AND table_name = '${tableName}'`);
        return results.recordset.map(r => r.column_name);
    }

    return {
        connection,
        getTableNames,
        getColumnNamesForTable,
    };
};

function getSchemaFromConfig(config) {
    const parts = url.parse(config.connection)
    let db = parts.pathname;
    if (db[0] === '/') {
        db = db.slice(1);
    }
    return db;
}
