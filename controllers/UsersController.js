import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    const user = await dbClient.users.findOne({ email });
    if (user) return res.status(400).send({ error: 'Already exist' });
    const newUser = {
      email,
      password: sha1(password),
    };
    const { insertedId } = await dbClient.users.insertOne(newUser);
    return res.status(201).send({ id: insertedId, email });
  }
}

export default UsersController;
