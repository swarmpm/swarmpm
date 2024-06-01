import { CLI } from "https://deno.land/x/spektr@0.0.5/spektr.ts";
import { colorPlugin } from "https://deno.land/x/spektr@0.0.5/plugins/color.ts";
import {
  createPublicClient,
  createWalletClient,
  http,
  PrivateKeyAccount,
} from "https://esm.sh/viem@2.13.3";
import { mainnet } from "https://esm.sh/viem@2.13.3/chains";
import { SwarmClient } from "./swarm.ts";
import { readDir } from "./utils.ts";

const cli = new CLI({ name: "swarmpm", plugins: [colorPlugin] });

const swarm = new SwarmClient();

const quota = cli.program("quota");

const publicClient = createPublicClient({
  transport: http("https://eth.llamarpc.com"),
});

const walletClient = createWalletClient({
  transport: http("https://eth.llamarpc.com"),
  chain: mainnet,
  // account: privateKeyToAccount(),
});

quota.command("buy", async (pos) => {
  const res = await swarm.buyPostageBatch({
    bzzTokenAmount: pos[0] as number,
    depth: pos[1] as number,
  });

  console.log(`Batch ID: ${res.batchID}`);
  console.log(`Transaction Hash: ${res.txHash}`);
}, {
  description: "Buy storage quota.",
});

quota.command("list", async ([batchID]) => {
  console.log(await swarm.getBucketData(batchID as string));
}, {
  description: "List bucket info",
});

cli.command("publish", async ([batchID]) => {
  const files = await readDir(".");

  const isConfirmed = confirm(
    `${files.map((f) => f.name).join("\n")}\nUpload package on Swarm?`,
  );

  if (!isConfirmed) {
    console.log("Not publishing. Quitting swarmpm.");
    Deno.exit(0);
  }

  const refID = await swarm.upload(
    { postageBatchID: batchID as string },
    ...files,
  );

  console.log(refID);
}, {
  options: [
    {
      name: "version",
      short: "v",
      description: "Package version",
      type: "string",
    },
  ] as const,
});

cli.handle(Deno.args);
