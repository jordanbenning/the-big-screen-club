import cors from 'cors';
import express, { type Request, type Response } from 'express';

const app = express();
const PORT =
  process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'The Big Screen Club API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
