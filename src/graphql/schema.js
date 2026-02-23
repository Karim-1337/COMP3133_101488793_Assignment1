const { readFileSync } = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.gql');
module.exports = readFileSync(schemaPath, 'utf8');
