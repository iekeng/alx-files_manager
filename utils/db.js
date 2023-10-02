const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}`;
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.client.connect().catch((error) => {
      console.error('DB Connection Error:', error);
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const usersCollection = this.client.db().collection('users');
    const count = await usersCollection.countDocuments();
    return count;
  }

  async nbFiles() {
    const filesCollection = this.client.db().collection('files');
    const count = await filesCollection.countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
