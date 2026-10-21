import 'dotenv/config';
import { app } from './app';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'AzureQuest API started');
});
