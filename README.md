# swarmpm

Decentralized package registry for [Deno](https://deno.com). Built with Swarm
and ENS.

## Docs

To deploy on SwarmPM, a Safe multi-sig is required. Follow the instruction
[here](https://blumen.stauro.dev/docs/safe.html).

### Initialize package

A Deno module only has a name and a version and it's duplicated locally in a
`swrm.json` file. All the versions live on Swarm and ENS..

```
swarmpm init
```

### Publish or update package

Prerequisite: Gnosis Safe with delegate(s) set up

Obtain Swarm's
[postage batch ID](https://github.com/ethersphere/swarm-cli?tab=readme-ov-file#purchasing-a-postage-stamp),
[delegate's private key](https://blumen.stauro.dev/docs/safe.html#setup) and
Safe's address:

```
DELEGATE_PK=0x......4
BATCH_ID=c65...b5
SAFE_ADDRESS=eth:0x0Fd...262
```

After that, run the command

```
$ swarmpm publish
swrm.json
mod.ts
Upload package with SwarmPM? [y/N] y
Enter version: 0.0.1
Preparing a transaction for Safe eth:0x0F...53dA0...262
Signing a Safe transaction
Proposing a Safe transaction
Propose transaction here: https://app.safe.global/transactions/queue?safe=eth:0x0F...53dA0...262
```

Confirm transaction in Safe
![image](https://github.com/swarmpm/swarmpm/assets/28968492/8e56bd65-51ae-4fec-8928-8e40032b6f7c)

### Import the module

You can run your own gateway which is a single-endpoint HTTP server.

See the repo [here](https://github.com/swarmpm/gateway).

To import a module, use the following syntax:

```ts
import { mod } from "http://<gateway-url>/hello-world@0.0.0/mod.ts";
```
