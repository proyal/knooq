# knooq

Knooq inspects your database schema and generates javascript
objects for use with [knexjs](http://knexjs.org/).

Benefits include:
* Code-completion suggestions in IDEs that support it
* Automatic inclusion of table aliases

Knooq was inspired by the workflow of the excellent,
and infinitely more complex, [jOOQ](https://www.jooq.org/).
### Installing knooq

In almost every case, you'll want to install knooq as a
development dependency. As it generates source, using it
in production is not expected.

```bash
npm install knooq --save-dev
```

```bash
yarn add knooq --dev
```

### Configuration

Knooq requires a configuration file in the current working
directory named `knooq.config.js`.

You must provide:
* Client name - `mysql`, `mysql2`, and `mssql` are supported
* Connection string - Formatted as is appropriate for the client library
* Location for the generated file.

#### mysql and mysql2
```javascript
module.exports = {
  client: 'mysql2', // Or 'mysql'
  connection: 'mysql://user:password@localhost:3306/mydatabase',
  output: 'src/schema.js'
};
```
#### mssql
```javascript
module.exports = {
  client: 'mssql',
  connection: 'mssql://user:password@localhost:1433/mydatabase',
  output: 'src/schema.js'
};
````
### Running knooq

Once the configuration file is complete, running knooq couldn't
be easier.

```bash
npx knooq
```

Or, my preference is to add a script to `package.json`.

```json
  "scripts": {
    "generate-schema": "knooq"
  },
```

```bash
npm run generate-schema
```

### The generated code

You will find the generated code in the `output` path
provided in the configuration file.

Knooq defines table names in 'constant case', and column names
into 'camel case'. 

Example output:

```javascript
const TABLES = {
  EMPLOYEES: function EMPLOYEES(alias = 'employees') {
    let prefix = ''
    let asClause = ''
    if (alias && alias.length > 0) {
      prefix = alias + '.'
      asClause = ' as ' + alias
    }
    return {
      $name: 'employees',
      $as: 'employees' + asClause,
      id: prefix + 'id',
      name: prefix + 'name',
      supervisorId: prefix + 'supervisor_id',
      departmentId: prefix + 'department_id'
    }
  },
  DEPARTMENTS: function DEPARTMENTS(alias = 'departments') {
    let prefix = ''
    let asClause = ''
    if (alias && alias.length > 0) {
      prefix = alias + '.'
      asClause = ' as ' + alias
    }
    return {
      $name: 'departments',
      $as: 'departments' + asClause,
      id: prefix + 'id',
      name: prefix + 'name'
    }
  }
}

module.exports = {
  TABLES
}
```

### So, what do I do with it?

Now, you use it in conjunction with knexjs to write knexjs queries,
like this!

```javascript
// Import the generated schema objects.
const TABLES = require('./schema').TABLES;
const knex = require('knex');

// Create some table objects with explicit aliases.
const e = TABLES.EMPLOYEES('e1');
const s = TABLES.EMPLOYEES('e2');

// Create a table object with no alias.
const d = TABLES.DEPARTMENTS();

// knex allows these 'select' objects where the keys are
// the aliases and the values are the column names. It's
// how I prefer to do this, but not required.
const EMPLOYEES = {
  employeeName: e.name,
  supervisorName: s.name,
  departmentName: d.name
};

function getEmployeesForSupervisor(supervisorId) {
  return knex
    .select(EMPLOYEES)
    .from(e.$as)
    .join(s.$as, s.id, e.supervisorId)
    .join(d.$as, d.id, e.departmentId)
    .where(s.id, supervisorId)
    .orderBy(e.id);
}
```
