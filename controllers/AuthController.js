import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    try {
      const authData = request.header('Authorization');

      if (!authData) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const [, base64Credentials] = authData.split(' ');

      if (!base64Credentials) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const buff = Buffer.from(base64Credentials, 'base64');
      const [email, password] = buff.toString('ascii').split(':');

      if (!email || !password) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const hashedPassword = sha1(password);
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ email, password: hashedPassword });

      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 'EX', 60 * 60 * 24); // Set expiration time
        response.status(200).json({ token });
      } else {
        response.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(request, response) {
    try {
      const token = request.header('X-Token');

      if (!token) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const key = `auth_${token}`;
      const id = await redisClient.get(key);

      if (id) {
        await redisClient.del(key);
        response.status(204).json({});
      } else {
        response.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      response.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;
