import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

if (!process.env.DEPLOY_PRIVATE_KEY) {
  throw new Error("DEPLOY_PRIVATE_KEY in .env not set");
}

const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
        accounts: [
          // rich wallets from local-node https://github.com/matter-labs/local-setup/blob/main/rich-wallets.json
          "0x77268...",
          "0xac1e7...",
        ],
      }
    : {
        url: process.env.ZKSYNC_TESTNET_URL,
        ethNetwork: "goerli",
        zksync: true,
        accounts: [
          // account PKs loaded from .env file
          process.env.DEPLOY_PRIVATE_KEY || "",
          process.env.USER_PRIVATE_KEY || "",
        ],
        // contract verification endpoint
        verifyURL:
          "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
      };

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest",
    settings: {
      isSystem: true,
    },
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: true,
    },
    zkSyncTestnet,
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
