import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    try {
      // Check if email and password are provided
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if the email already exists in the database
      const users = dbClient.db.collection('users');
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash the password using sha1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const { insertedId } = await users.insertOne(newUser);

      // Add the user to the queue
      userQueue.add({ userId: insertedId });

      // Respond with the new user (excluding the password)
      return res.status(201).json({
        id: insertedId,
        email,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;

    try {
      const userId = await redisClient.get(key);
      if (!userId) {
        console.log('Not Found!');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      const user = await users.findOne({ _id: idObject });

      if (user) {
        return res.status(200).json({ id: userId, email: user.email });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
