import { CLI } from "https://deno.land/x/spektr@0.0.5/spektr.ts";
import { colorPlugin } from "https://deno.land/x/spektr@0.0.5/plugins/color.ts";
import {
  Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  type Hex,
  http,
  parseAbi,
} from "https://esm.sh/viem@2.13.3";
import { privateKeyToAccount } from "https://esm.sh/viem@2.13.3/accounts";
import { mainnet, sepolia } from "https://esm.sh/viem@2.13.3/chains";
import { getEnsText } from "https://esm.sh/viem@2.13.3/ens";
import { SwarmClient } from "./swarm.ts";
import {
  ChainName,
  chainToRpcUrl,
  chainToSafeApiUrl,
  createSwrmJson,
  readDir,
  readSwrmJson,
  updateSwrmVersion,
} from "./utils.ts";
import { parse } from "https://deno.land/std@0.224.0/path/parse.ts";
import {
  publicSafeActions,
  walletSafeActions,
} from "https://esm.sh/@stauro/piggybank@0.1.0/actions";
import { parseEip3770Address } from "https://esm.sh/@stauro/piggybank@0.1.0/utils";
import { OperationType } from "https://esm.sh/@stauro/piggybank@0.1.0/types";
import { ApiClient } from "https://esm.sh/@stauro/piggybank@0.1.0/api";
import { namehash, normalize } from "https://esm.sh/viem@2.13.3/ens";

const cli = new CLI({ name: "swarmpm", plugins: [colorPlugin] });

const swarm = new SwarmClient();

const quota = cli.program("quota");

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

cli.command("init", async () => {
  const { name } = parse(Deno.cwd());

  const version = prompt("Set initial version:", "0.0.0");

  if (!version) throw new Error("Version must be a string");

  await createSwrmJson({ name, version });

  console.log(`SwarmPM package initialized.`);
});

const PUBLIC_RESOLVER_ADDRESS: Record<"mainnet" | "sepolia", Address> = {
  mainnet: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
  sepolia: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
} as const;

const abi = parseAbi([
  "function setText(bytes32 node, string key, string value) external",
]);

cli.command("publish", async (_, { chain: chainName = "mainnet" }) => {
  const batchID = Deno.env.get("BATCH_ID");
  if (!batchID) throw new Error("Swarm postage batch ID is required.");
  const config = await readSwrmJson();
  const files = await readDir(".");

  const pk = Deno.env.get("DELEGATE_PK") as Hex;

  if (!pk) throw new Error("delegate private key is not set up");

  const safeAddress = Deno.env.get("SAFE_ADDRESS") as Hex;

  if (!safeAddress) throw new Error("Safe address is not set up");

  const chain = chainName === "mainnet" ? mainnet : sepolia;

  const walletClient = createWalletClient({
    transport: http(chainToRpcUrl(chainName as ChainName)),
    chain,
    account: privateKeyToAccount(pk),
  });

  walletClient.extend(walletSafeActions(safeAddress));

  const isConfirmed = confirm(
    `${files.map((e) => e.name).join("\n")}\nUpload package with SwarmPM?`,
  );

  if (!isConfirmed) {
    console.log("Not publishing. Quitting swarmpm.");
    Deno.exit(0);
  }

  const version = prompt("Enter version:");

  if (!version) throw new Error("version can't be empty");

  const publicClient = createPublicClient({
    transport: http(chainToRpcUrl(chainName as ChainName)),
    chain,
  }).extend(publicSafeActions(safeAddress));

  const swarmCid = await getEnsText(publicClient, {
    name: `${config.name}.swarmpm.eth`,
    key: version,
  });

  if (swarmCid) throw new Error(`Version ${version} already exists`);

  await updateSwrmVersion(version);

  const refID = await swarm.upload(
    { postageBatchID: batchID as string },
    ...files,
  );

  const request = await publicClient.prepareTransactionRequest({
    account: parseEip3770Address(safeAddress).address,
    to: PUBLIC_RESOLVER_ADDRESS[chainName as ChainName],
    chain,
    data: encodeFunctionData({
      functionName: "setText",
      abi,
      args: [namehash(normalize(`${config.name}.swarmpm.eth`)), version, refID],
    }),
  });

  console.info(`Preparing a transaction for Safe ${safeAddress}`);
  const safeWalletClient = walletClient.extend(walletSafeActions(safeAddress));

  const safePublicClient = publicClient.extend(publicSafeActions(safeAddress));

  const nonce = await safePublicClient.getSafeNonce();

  const txData = {
    ...request,
    to: request.to as Address,
    operation: OperationType.Call,
    gasPrice: request.gasPrice ?? 0n,
    nonce,
  };

  const safeTxGas = await safePublicClient.estimateSafeTransactionGas(txData);

  const baseGas = await safePublicClient.estimateSafeTransactionBaseGas({
    ...txData,
    safeTxGas,
  });

  const safeTxHash = await safePublicClient.getSafeTransactionHash({
    ...txData,
    safeTxGas,
    baseGas,
  });

  console.info("Signing a Safe transaction");

  const senderSignature = await safeWalletClient
    .generateSafeTransactionSignature({
      ...txData,
      safeTxGas,
      baseGas,
    });

  console.info("Proposing a Safe transaction");

  const apiClient = new ApiClient({
    url: chainToSafeApiUrl(chainName as ChainName),
    safeAddress,
    chainId: chain.id,
  });

  apiClient.proposeTransaction({
    safeTransactionData: { ...txData, safeTxGas, baseGas, nonce },
    senderAddress: walletClient.account.address,
    safeTxHash,
    senderSignature,
    chainId: chain.id,
    origin: `SwarmPM module: ${config.name}`,
  });
  const safeLink =
    `https://app.safe.global/transactions/queue?safe=${safeAddress}`;

  console.log(`Propose transaction here: ${safeLink}`);
}, {
  options: [
    {
      name: "chain",
      type: "string",
      description: "Network to use for ENS (mainnet by default)",
    },
  ] as const,
});

cli.handle(Deno.args);
