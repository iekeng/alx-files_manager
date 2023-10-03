import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    try {
      // Check if email and password are provided
      if (!email) return res.status(400).send({ error: 'Missing email' });
      if (!password) return res.status(400).send({ error: 'Missing password' });

      // Check if the email already exists in the database
      const userExists = await dbClient.users.findOne({ email });
      if (userExists) return res.status(400).send({ error: 'Email already exists' });

      // Hash the password using sha1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const { insertedId } = await dbClient.users.insertOne(newUser);

      // Respond with the new user (excluding the password)
      res.status(201).send({
        id: insertedId,
        email,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Internal server error' });
	  return;
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    return res.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
