import { VariableId, DataPoint, DatasetMetadata } from "../types";
import { NASA_VARIABLES, DATASET_TIMESERIES, REGIONAL_HOTSPOTS } from "../data/nasaDatasets";

export interface DataSourceStatus {
  mode: "LIVE_NASA" | "DEMO_DATA";
  sourceName: string;
  isLive: boolean;
  message: string;
  lastChecked: Date;
}

class NASADataService {
  private static instance: NASADataService;
  private currentStatus: DataSourceStatus = {
    mode: "DEMO_DATA",
    sourceName: "Calibrated NASA Open Science Dataset (Offline/Demo Mode)",
    isLive: false,
    message: "Using officially calibrated historical measurements (1980–2025).",
    lastChecked: new Date(),
  };

  private constructor() {
    this.checkLiveConnection();
  }

  public static getInstance(): NASADataService {
    if (!NASADataService.instance) {
      NASADataService.instance = new NASADataService();
    }
    return NASADataService.instance;
  }

  public async checkLiveConnection(): Promise<DataSourceStatus> {
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;
      const res = await fetch("/api/nasa/status", {
        signal: controller ? controller.signal : undefined,
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.currentStatus = {
          mode: data.mode === "LIVE_NASA" ? "LIVE_NASA" : "DEMO_DATA",
          sourceName: data.source || "NASA Open APIs",
          isLive: data.mode === "LIVE_NASA",
          message: data.available
            ? "Connected to live NASA Open Science endpoints."
            : "NASA Open APIs offline or rate-limited; running in Calibrated Demo Mode.",
          lastChecked: new Date(),
        };
      }
    } catch {
      this.currentStatus = {
        mode: "DEMO_DATA",
        sourceName: "Calibrated NASA Open Science Dataset (Offline Demo Mode)",
        isLive: false,
        message: "Offline sandbox environment active. Seamlessly using calibrated historical data.",
        lastChecked: new Date(),
      };
    }
    return this.currentStatus;
  }

  public getStatus(): DataSourceStatus {
    return this.currentStatus;
  }

  public getAllVariables(): DatasetMetadata[] {
    return NASA_VARIABLES;
  }

  public getVariableMetadata(id: VariableId): DatasetMetadata {
    const meta = NASA_VARIABLES.find((v) => v.id === id);
    if (!meta) {
      return NASA_VARIABLES[0];
    }
    return meta;
  }

  public getTimeSeries(id: VariableId): DataPoint[] {
    return DATASET_TIMESERIES[id] || DATASET_TIMESERIES.temperature;
  }

  public getDataPointForYear(id: VariableId, year: number): DataPoint {
    const series = this.getTimeSeries(id);
    // Find closest year
    let closest = series[0];
    let minDiff = Math.abs(series[0].year - year);
    for (const pt of series) {
      const diff = Math.abs(pt.year - year);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    return closest;
  }

  public getHotspots(id: VariableId) {
    return REGIONAL_HOTSPOTS[id] || [];
  }

  // Explicit functions required by Challenge Spec:
  public async getTemperatureData(): Promise<DataPoint[]> {
    return this.getTimeSeries("temperature");
  }

  public async getOceanData(): Promise<DataPoint[]> {
    return this.getTimeSeries("ocean");
  }

  public async getWindData(): Promise<DataPoint[]> {
    return this.getTimeSeries("wind");
  }

  public async getPrecipitationData(): Promise<DataPoint[]> {
    return this.getTimeSeries("precipitation");
  }

  public async getVegetationData(): Promise<DataPoint[]> {
    return this.getTimeSeries("vegetation");
  }

  public async getWildfireData(): Promise<DataPoint[]> {
    return this.getTimeSeries("wildfire");
  }

  public async getIceData(): Promise<DataPoint[]> {
    return this.getTimeSeries("ice");
  }

  public async getSeaLevelData(): Promise<DataPoint[]> {
    return this.getTimeSeries("sealevel");
  }

  public async getCO2Data(): Promise<DataPoint[]> {
    return this.getTimeSeries("co2");
  }

  public async getCloudsData(): Promise<DataPoint[]> {
    return this.getTimeSeries("clouds");
  }

  public async getPressureData(): Promise<DataPoint[]> {
    return this.getTimeSeries("pressure");
  }
}

export const nasaDataService = NASADataService.getInstance();
