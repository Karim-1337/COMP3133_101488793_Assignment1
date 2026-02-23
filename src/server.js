require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const connectDB = require('./config/db');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => ({
      message: err.message,
      extensions: err.extensions,
    }),
  });

  await server.start();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    })
  );

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Employee Management API' });
  });

  app.get('/', (req, res) => {
    const graphqlUrl = `${req.protocol}://${req.get('host')}/graphql`;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>GraphiQL - Employee Management API</title>
  <link href="https://unpkg.com/graphiql@3/graphiql.min.css" rel="stylesheet" />
</head>
<body>
  <div id="graphiql" style="height: 100vh;"></div>
  <script crossorigin src="https://unpkg.com/react/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
  <script>
    function graphQLFetcher(params) {
      return fetch('${graphqlUrl}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).then(function(r) { return r.json(); });
    }
    var root = React.createElement(GraphiQL, { fetcher: graphQLFetcher });
    ReactDOM.render(root, document.getElementById('graphiql'));
  </script>
</body>
</html>
    `);
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`Use GraphiQL or Postman to test.`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
