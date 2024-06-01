import "https://deno.land/std@0.224.0/dotenv/load.ts";

export type Config = {
  name: string;
  version: string;
};

export type ChainName = "mainnet" | "sepolia";

export const readDir = async (dir = ".") => {
  const files: File[] = [];
  for await (
    const entry of Deno.readDir(dir)
  ) {
    if (entry.isFile && !entry.name.startsWith(".")) {
      const blob = await Deno.readFile(entry.name);
      const file = new File([blob], entry.name);
      files.push(file);
    }
  }
  return files;
};

export const createSwrmJson = async (
  { name, version }: { name: string; version: string },
) => {
  await Deno.writeTextFile(
    "swrm.json",
    JSON.stringify(
      {
        name,
        version,
      },
      null,
      2,
    ),
    { createNew: true },
  );
};

export const readSwrmJson = async (): Promise<Config> => {
  const jsonFile = await Deno.readTextFile("swrm.json");

  return JSON.parse(jsonFile);
};

export const updateSwrmVersion = async (version: string): Promise<void> => {
  const file = await readSwrmJson();

  await Deno.writeTextFile(
    "swrm.json",
    JSON.stringify({ ...file, version }, null, 2),
  );
};

export const chainToRpcUrl = (chain: ChainName) => {
  switch (chain) {
    case "mainnet":
      return "https://rpc.ankr.com/eth";
    case "sepolia":
      return "https://rpc.ankr.com/eth_sepolia";
  }
};

export const chainToSafeApiUrl = (chainName: ChainName) =>
  `https://safe-transaction-${chainName}.safe.global`;
