declare module "dxf" {
  interface DxfEntity {
    type: string;
    layer?: string;
    text?: string;
    string?: string;
    position?: { x: number; y: number; z?: number };
    start?: { x: number; y: number; z?: number };
    end?: { x: number; y: number; z?: number };
    vertices?: Array<{ x: number; y: number; z?: number }>;
    name?: string;
    block?: string; // INSERT entities: block name (DXF group code 2)
    measureStart?: { x: number; y: number; z?: number };
    measureEnd?: { x: number; y: number; z?: number };
    x?: number;
    y?: number;
    z?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface DxfLayer {
    name: string;
    [key: string]: unknown;
  }

  interface DxfParsed {
    header: Record<string, unknown>;
    entities: DxfEntity[];
    tables: { layers: Record<string, unknown> };
    blocks: unknown[];
    [key: string]: unknown;
  }

  class Helper {
    constructor(dxfContent: string);
    parsed: DxfParsed;
    toSVG(): string;
  }
}
