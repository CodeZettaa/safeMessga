type WindowRecord = {
  count: number;
  startedAt: number;
};

type BlockRecord = {
  until: number;
  rejections: number;
};

const windows = new Map<string, WindowRecord>();
const blocks = new Map<string, BlockRecord>();
const lastSubmission = new Map<string, number>();
const fingerprints = new Map<string, number>();

export function resetMemoryStores() {
  windows.clear();
  blocks.clear();
  lastSubmission.clear();
  fingerprints.clear();
}

export const memoryStore = {
  windows,
  blocks,
  lastSubmission,
  fingerprints,
};
