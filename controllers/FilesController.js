import { ObjectId } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).send({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).send({ error: 'Missing data' });
    if (parentId) {
      const parent = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!parent || parent.type !== 'folder') return res.status(400).send({ error: 'Parent not found' });
    }
    const file = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    };
    if (type !== 'folder') {
      const path = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      const localPath = `${path}/${uuidv4()}`;
      const clearData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, clearData);
      file.localPath = localPath;
    }
    const result = await dbClient.files.insertOne(file);
    file._id = result.insertedId;
    return res.status(201).send(file);
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const fileId = req.params.id;
    const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId && !file.isPublic) return res.status(404).send({ error: 'Not found' });
    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const parentId = req.query.parentId || 0;
    const parent = await dbClient.files.findOne({ _id: ObjectId(parentId) });
    if (parentId !== 0 && (!parent || parent.type !== 'folder')) return res.status(200).send([]);
    const query = parentId === 0 ? { parentId, userId: ObjectId(userId) } : { parentId };
    const files = await dbClient.files.find(query).toArray();
    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const fileId = req.params.id;
    const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
    const isPublic = req.body.isPublic || false;
    await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic } });
    const updatedFile = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    return res.status(200).send({ ...updatedFile });
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const fileId = req.params.id;
    const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
    await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
    const updatedFile = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    return res.status(200).send({ ...updatedFile });
  }
}

module.exports = FilesController;
