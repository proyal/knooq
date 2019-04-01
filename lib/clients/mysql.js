module.exports = function createConnection(config) {
    let client;
    try {
        client = require('mysql');
    } catch (e) {
        throw new Error('Client dependency (mysql) not found. Run `npm install mysql`')
    }
    let connection = client.createConnection(config.connection);

    const schemaName = getSchemaFromConfig(config);

    async function getTableNames() {
        return new Promise((resolve, reject) => {
            connection.query(`SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = '${schemaName}'`,
                (err, results, fields) => {
                    if (err) {
                        reject(err);
                    } else {
                        results = results.map(r => r.table_name);
                        resolve(results);
                    }
                });
        });
    }

    async function getColumnNamesForTable(tableName) {
        return new Promise((resolve, reject) => {
            connection.query(`SELECT column_name FROM information_schema.columns
                        WHERE table_schema = '${schemaName}'
                        AND table_name = '${tableName}'`,
                (err, results, fields) => {
                    if (err) {
                        reject(err);
                    } else {
                        results = results.map(r => r.column_name);
                        resolve(results);
                    }
                });
        });
    }

    return {
        connection,
        getTableNames,
        getColumnNamesForTable,
    };
};

function getSchemaFromConfig(config) {
    let a = config.connection.split('/');
    return a[a.length - 1];
}
