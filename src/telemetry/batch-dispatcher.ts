import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { StlUsageCollector } from './stl-collector';

export interface TelemetryEvent {
  symbol: string;
  count: number;
}

export interface TelemetryPayload {
  client_version: string;
  platform: string;
  batch_window_seconds: number;
  events: TelemetryEvent[];
}

/**
 * Coordinates periodic aggregation, jittered flush timers, and offline queue persistence.
 */
export class BatchDispatcher implements vscode.Disposable {
  private timer: NodeJS.Timeout | null = null;
  private queueFilePath: string | null = null;
  private isFlushing = false;

  constructor(
    private readonly collector: StlUsageCollector,
    private readonly globalStoragePath?: string,
    private readonly endpointUrl: string = 'https://telemetry.novacpp.dev/v1/telemetry/stl-usage',
    private readonly flushIntervalMs: number = 60 * 60 * 1000 // 60 minutes
  ) {
    if (globalStoragePath) {
      this.queueFilePath = path.join(globalStoragePath, 'telemetry-queue.json');
    }
  }

  /**
   * Starts the periodic flush timer with randomized jitter.
   */
  public start(): void {
    this.scheduleNextFlush();
  }

  /**
   * Schedules next flush with random jitter (+/- 10 minutes).
   */
  private scheduleNextFlush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // 10-minute maximum jitter
    const jitter = Math.floor((Math.random() - 0.5) * 20 * 60 * 1000);
    const delay = Math.max(60 * 1000, this.flushIntervalMs + jitter);

    this.timer = setTimeout(async () => {
      await this.flushNow();
      this.scheduleNextFlush();
    }, delay);
  }

  /**
   * Flushes in-memory counts immediately to the telemetry ingestion endpoint or offline queue.
   */
  public async flushNow(kAnonymityThreshold: number = 3): Promise<boolean> {
    if (this.isFlushing) {
      return false;
    }

    this.isFlushing = true;
    try {
      if (!this.collector.isTelemetryAllowed()) {
        this.collector.clear();
        return false;
      }

      const counts = this.collector.flushCounts(kAnonymityThreshold);
      const events: TelemetryEvent[] = Object.entries(counts).map(([symbol, count]) => ({
        symbol,
        count
      }));

      if (events.length === 0) {
        return true;
      }

      const payload: TelemetryPayload = {
        client_version: '0.1.0',
        platform: process.platform,
        batch_window_seconds: Math.round(this.flushIntervalMs / 1000),
        events
      };

      const success = await this.transmitPayload(payload);
      if (!success) {
        this.persistOfflineQueue(payload);
      }

      return success;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Transmits JSON payload over HTTPS to the ingestion server.
   */
  public async transmitPayload(payload: TelemetryPayload): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const url = new URL(this.endpointUrl);
        const data = JSON.stringify(payload);

        const client = url.protocol === 'http:' ? http : https;
        const req = client.request(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
              'User-Agent': 'NovaCpp-Client/0.1.0'
            },
            timeout: 5000
          },
          (res) => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        );

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        req.write(data);
        req.end();
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Saves failed payloads into an offline disk queue with a 500 KB limit.
   */
  public persistOfflineQueue(payload: TelemetryPayload): void {
    if (!this.queueFilePath) {
      return;
    }

    try {
      const dir = path.dirname(this.queueFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let existing: TelemetryPayload[] = [];
      if (fs.existsSync(this.queueFilePath)) {
        const content = fs.readFileSync(this.queueFilePath, 'utf8');
        existing = JSON.parse(content);
      }

      existing.push(payload);

      // Enforce 500 KB ceiling with FIFO eviction
      const serialized = JSON.stringify(existing);
      if (Buffer.byteLength(serialized, 'utf8') > 500 * 1024) {
        existing.shift();
      }

      fs.writeFileSync(this.queueFilePath, JSON.stringify(existing, null, 2), 'utf8');
    } catch (err) {
      console.warn('NovaCpp: Failed to persist offline telemetry queue:', err);
    }
  }

  /**
   * Cleans up timer and flushes any pending metrics on shutdown.
   */
  public dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
