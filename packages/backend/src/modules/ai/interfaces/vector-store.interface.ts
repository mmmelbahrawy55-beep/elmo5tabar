export interface VectorSearchResult {
  id: string;
  knowledgeBaseId: string;
  content: string;
  contentAr?: string;
  score: number;
  metadata: {
    title: string;
    titleAr?: string;
    documentType: string;
    category?: string;
    tags: string[];
    source?: string;
  };
}

export interface VectorStoreConfig {
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotProduct';
  indexType: 'ivfflat' | 'hnsw';
}

export interface VectorStore {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  batchUpsert(vectors: { id: string; vector: number[]; metadata: Record<string, unknown> }[]): Promise<void>;
  search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorSearchResult[]>;
  delete(ids: string[]): Promise<void>;
  clear(): Promise<void>;
}
