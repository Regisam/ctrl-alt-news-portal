import { google } from 'googleapis';

interface GSCMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCResponse {
  data: {
    rows?: Array<{
      keys: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }>;
  };
}

export class GSCClient {
  private auth: InstanceType<typeof google.auth.GoogleAuth>;
  private searchConsole: ReturnType<typeof google.searchconsole>;

  constructor(credentials: Record<string, unknown>) {
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth: this.auth,
    });
  }

  async getTopQueries(siteUrl: string, days: number = 30): Promise<GSCQuery[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(new Date()),
          dimensions: ['query'],
          rowLimit: 10,
        },
      });

      return (response.data.rows || [])
        .filter((row) => row.keys && row.keys.length > 0)
        .map((row) => ({
          query: row.keys?.[0] || '',
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        }));
    } catch (error) {
      console.error('Error fetching top queries:', error);
      return [];
    }
  }

  async getTopPages(siteUrl: string, days: number = 30): Promise<GSCPage[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(new Date()),
          dimensions: ['page'],
          rowLimit: 10,
        },
      });

      return (response.data.rows || [])
        .filter((row) => row.keys && row.keys.length > 0)
        .map((row) => ({
          page: row.keys?.[0] || '',
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        }));
    } catch (error) {
      console.error('Error fetching top pages:', error);
      return [];
    }
  }

  async getAggregateMetrics(siteUrl: string, days: number = 30): Promise<GSCMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(new Date()),
        },
      });

      const data = response.data;
      const rows = data.rows || [];
      return {
        clicks: rows.reduce((sum: number, row) => sum + (row.clicks || 0), 0),
        impressions: rows.reduce((sum: number, row) => sum + (row.impressions || 0), 0),
        ctr: rows.length ? (rows.reduce((sum: number, row) => sum + (row.ctr || 0), 0) / rows.length) : 0,
        position: rows.length ? (rows.reduce((sum: number, row) => sum + (row.position || 0), 0) / rows.length) : 0,
      };
    } catch (error) {
      console.error('Error fetching aggregate metrics:', error);
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export type { GSCMetrics, GSCQuery, GSCPage };
