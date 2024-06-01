export class SwarmClient {
  #apiUrl = "http://localhost:1633";
  constructor(
    { apiUrl }: { apiUrl?: string } = {},
  ) {
    if (apiUrl) this.#apiUrl = apiUrl;
  }

  async upload(
    { postageBatchID }: { postageBatchID: string },
    ...files: File[]
  ): Promise<string> {
    if (!postageBatchID) throw new Error("Missing postage batch ID");
    const fd = new FormData();

    for (const file of files) fd.append("file", file);

    const res = await fetch(`${this.#apiUrl}/bzz`, {
      method: "POST",
      body: fd,
      headers: {
        "swarm-postage-batch-id": postageBatchID,
      },
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message);

    return json.reference;
  }
  async buyPostageBatch(
    { amount, depth = 20 }: { amount: number; depth?: number },
  ): Promise<{
    batchID: string;
    txHash: `0x${string}`;
  }> {
    const res = await fetch(`${this.#apiUrl}/stamps/${amount}/${depth}`, {
      method: "POST",
    });

    return await res.json();
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
