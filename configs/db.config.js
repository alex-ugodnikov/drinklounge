const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(x => console.log(`Successfully connected to the database ${x.connections[0].name}`))
  .catch(error => {
    console.error(`An error ocurred trying to connect to the database: `, error);
    process.exit(1);
  });
