import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use('/', router);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

export default app;
