import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

async function thumbNail(width, localPath) {
  const thumbnail = await imageThumbnail(localPath, { width });
  return thumbnail;
}

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId || !userId) {
    throw new Error('Missing fileId or userId');
  }

  const files = dbClient.db.collection('files');
  const idObject = new ObjectID(fileId);
  const file = await files.findOne({ _id: idObject });

  if (!file) {
    throw new Error('File not found');
  }

  const fileName = file.localPath;
  const [thumbnail500, thumbnail250, thumbnail100] = await Promise.all([
    thumbNail(500, fileName),
    thumbNail(250, fileName),
    thumbNail(100, fileName),
  ]);

  const [image500, image250, image100] = await Promise.all([
    fs.writeFile(`${file.localPath}_500`, thumbnail500),
    fs.writeFile(`${file.localPath}_250`, thumbnail250),
    fs.writeFile(`${file.localPath}_100`, thumbnail100),
  ]);
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) {
    throw new Error('Missing userId');
  }

  const users = dbClient.db.collection('users');
  const idObject = new ObjectID(userId);
  const user = await users.findOne({ _id: idObject });

  if (user) {
    console.log(`Welcome ${user.email}!`);
  } else {
    throw new Error('User not found');
  }
});

