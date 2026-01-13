type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = (level.toLowerCase() as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (this.shouldLog('error')) {
      const errorMeta = error instanceof Error 
        ? { message: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
      console.error(this.formatMessage('error', message, errorMeta));
    }
  }
}

let loggerInstance: Logger | null = null;

export function getLogger(level?: string): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(level);
  }
  return loggerInstance;
}
