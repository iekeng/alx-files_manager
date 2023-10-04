import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static async postNew(request, response) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        response.status(400).json({ error: 'Missing email or password' });
        return;
      }

      const users = dbClient.db.collection('users');
      const user = await users.findOne({ email });

      if (user) {
        response.status(400).json({ error: 'User already exists' });
      } else {
        const hashedPassword = sha1(password);
        const result = await users.insertOne({
          email,
          password: hashedPassword,
        });

        const { insertedId } = result;
        response.status(201).json({ id: insertedId, email });
        userQueue.add({ userId: insertedId });
      }
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(request, response) {
    try {
      const token = request.header('X-Token');

      if (!token) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (userId) {
        const users = dbClient.db.collection('users');
        const idObject = new ObjectID(userId);
        const user = await users.findOne({ _id: idObject });

        if (user) {
          response.status(200).json({ id: userId, email: user.email });
        } else {
          response.status(401).json({ error: 'Unauthorized' });
        }
      } else {
        console.log('User not found!');
        response.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
