import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const db = process.env.DB_DATABASE || 'files_manager';

    this.uri = `mongodb://${host}:${port}/${db}`;
    this.connected = false;
    this.client = new MongoClient(this.uri, {
      useUnifiedTopology: true,
    });
    this.client.connect()
    .then(() => {
        this.db = this.client.db(db);
        this.connected = true;
    }).catch((error) => {
      console.log(`mongodb error: ${error}`);
    });
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
