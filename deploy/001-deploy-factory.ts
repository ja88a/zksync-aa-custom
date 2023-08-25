import { Contract, utils, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { ZkSyncArtifact } from "@matterlabs/hardhat-zksync-deploy/dist/types";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

export default async function (hre: HardhatRuntimeEnvironment) {
  // Private key of the account used to deploy
  const wallet: Wallet = new Wallet(process.env.DEPLOY_PRIVATE_KEY || '');
  const deployer: Deployer = new Deployer(hre, wallet);

  // Contract to deploy
  const factoryArtifact: ZkSyncArtifact = await deployer.loadArtifact("AAFactory");
  
  // Contract's dependency: MultiSig contract
  const aaArtifact: ZkSyncArtifact = await deployer.loadArtifact("TwoUserMultisig");
  // Getting the bytecodeHash of the account
  const bytecodeHash: Uint8Array = utils.hashBytecode(aaArtifact.bytecode);

  const factory: Contract = await deployer.deploy(
    factoryArtifact,
    [bytecodeHash],
    undefined,
    [
      // Since the factory requires the code of the multisig to be available,
      // we should pass it here as well.
      aaArtifact.bytecode,
    ]
  );

  const aaArtifactHashHex: string = Buffer.from(bytecodeHash).toString('hex');
  console.log(`AA factory address: ${factory.address}\n\tArtifact BytecodeHash: 0x${aaArtifactHashHex}`);
}
