import { MongoClient } from 'mongodb';

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
    return !!this.client && !!this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    const users = await this.db.collection('users').find().count();
    return users;
  }

  async nbFiles() {
    const files = await this.db.collection('files').find().count();
    return files;
  }
}

const dbClient = new DBClient();
export default dbClient;
