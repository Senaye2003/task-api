import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import taskRoutes from './routes/taskRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

const specs = YAML.load('./public/bundled.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/tasks', taskRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
