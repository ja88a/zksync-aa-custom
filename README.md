# Custom AA on zkSync

## Purpose

Experiment the support for Account abstraction on zkSync (v2, Era).

Initial: 

1. Create/Deploy a factory contract for creating AAccounts
2. Create an AAccount
3. Use the AAcount to create/deploy a 2:2 multisig contract

## Features


## Installation and compilation

You need Node.js and Yarn.

Install all dependencies with `pnpm install` or `yarn`.

Compile all contracts with `yarn hardhat compile`

## Deployment and usage

To run the scripts to deploy and execute the contracts, use the `zksync-deploy` command:

- `yarn hardhat deploy-zksync --script deploy-factory.ts`: deploys the factory contract
- `yarn hardhat deploy-zksync --script deploy-multisig.ts`: deploys a multisig wallet and executes a transaction.

# Account Abstraction - zkSync Tutorial

## Initial Fork

Refer to [matter-labs / custom-aa-tutorial](https://github.com/matter-labs/custom-aa-tutorial)

Code for the "Account abstraction" tutorial from the [zkSync v2 documentation](https://v2-docs.zksync.io/dev/).

You can find a full step-by-step guide to build this project [in this article](https://v2-docs.zksync.io/dev/tutorials/custom-aa-tutorial.html#prerequisite).

## Support

Check out the [common errors section in the tutorial](https://v2-docs.zksync.io/dev/tutorials/custom-paymaster-tutorial.html#prerequisite), open an issue, or [contact us on Discord](https://discord.com/invite/px2aR7w).
