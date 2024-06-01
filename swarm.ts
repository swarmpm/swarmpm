export class SwarmClient {
  #apiUrl = "http://localhost:1633";
  constructor(
    { apiUrl }: { apiUrl?: string } = {},
  ) {
    if (apiUrl) this.#apiUrl = apiUrl;
  }

  async upload(
    { postageBatchID, indexFile }: {
      postageBatchID: string;
      indexFile?: string;
    },
    ...files: File[]
  ): Promise<string> {
    if (!postageBatchID) throw new Error("Missing postage batch ID");
    const fd = new FormData();

    for (const file of files) fd.append("file", file);

    const res = await fetch(`${this.#apiUrl}/bzz`, {
      method: "POST",
      body: fd,
      headers: indexFile
        ? {
          "swarm-postage-batch-id": postageBatchID,
          "swarm-index-document": indexFile,
        }
        : {
          "swarm-postage-batch-id": postageBatchID,
        },
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message);

    return json.reference;
  }
  async buyPostageBatch(
    { bzzTokenAmount = 1, depth = 20 }: {
      bzzTokenAmount?: number;
      depth?: number;
    },
  ): Promise<{
    batchID: string;
    txHash: `0x${string}`;
  }> {
    const amount = bzzTokenAmount * 1_000_000_000;

    const res = await fetch(
      `${this.#apiUrl}/stamps/${amount}/${depth}`,
      {
        method: "POST",
      },
    );

    const json = await res.json();

    if (!res.ok) throw new Error(json.message);

    return json;
  }
  async getBucketData(batchID: string): Promise<{
    "depth": number;
    "bucketDepth": number;
    "bucketUpperBound": number;
    "buckets": {
      "bucketID": number;
      "collisions": number;
    }[];
  }> {
    const res = await fetch(`${this.#apiUrl}/stamps/${batchID}/buckets`);

    return await res.json();
  }
}
