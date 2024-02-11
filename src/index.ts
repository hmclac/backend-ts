import { LoggerModes, jetLogger } from 'jet-logger';
import { Router } from './Router';

process.env.LOGGER_MODE = LoggerModes.Console;

export const logger = jetLogger(LoggerModes.Console);

const server = new Router();
