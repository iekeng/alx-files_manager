const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.client = new MongoClient(`mongodb://${host}:${port}`, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if (err) console.log(err);
      else console.log('Database connected');
    });
    this.db = this.client.db(database);
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const users = this.db.collection('users');
    const usersStat = await users.countDocuments();
    return usersStat;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    const filesStat = await files.countDocuments();
    return filesStat;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
