type Level = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envMode = process.env.NODE_ENV ?? 'development';
const envLevel = (process.env.LOG_LEVEL as Level | undefined) ?? (envMode === 'development' ? 'debug' : 'info');

class Logger {
  private readonly level: Level;
  private readonly mode: string;
  private readonly bindings: Record<string, unknown>;

  constructor(options?: { level?: Level; mode?: string; bindings?: Record<string, unknown> }) {
    this.level = options?.level ?? envLevel;
    this.mode = options?.mode ?? envMode;
    this.bindings = options?.bindings ?? {};
  }

  with(bindings: Record<string, unknown>): Logger {
    return new Logger({ level: this.level, mode: this.mode, bindings: { ...this.bindings, ...bindings } });
  }

  private shouldLog(level: Level): boolean {
    return levelOrder[level] >= levelOrder[this.level];
  }

  private basePayload(level: Level, msg: string, meta?: Record<string, unknown>) {
    return {
      time: new Date().toISOString(),
      level,
      msg,
      ...this.bindings,
      ...(meta ?? {}),
    };
  }

  private write(level: Level, msg: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;
    const payload = this.basePayload(level, msg, meta);
    if (this.mode === 'production') {
      const line = JSON.stringify(payload);
      if (level === 'error') process.stderr.write(line + '\n');
      else process.stdout.write(line + '\n');
      return;
    }
    const { time, ...rest } = payload as Record<string, unknown>;
    const kv = Object.entries(rest)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' ');
    const line = `${time} [${level.toUpperCase()}] ${kv}`;
    if (level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  }

  debug(msg: string, meta?: Record<string, unknown>) {
    this.write('debug', msg, meta);
  }

  info(msg: string, meta?: Record<string, unknown>) {
    this.write('info', msg, meta);
  }

  warn(msg: string, meta?: Record<string, unknown>) {
    this.write('warn', msg, meta);
  }

  error(msg: string, meta?: Record<string, unknown>) {
    this.write('error', msg, meta);
  }
}

export const logger = new Logger();
export type { Logger };

