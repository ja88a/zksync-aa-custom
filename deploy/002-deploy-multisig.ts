import { utils, Wallet, Provider, EIP712Signer, types, Contract } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });


export default async function (hre: HardhatRuntimeEnvironment) {
  const provider: Provider = new Provider(process.env.ZKSYNC_TESTNET_URL);

  // AAFactory integration
  const deployerWallet: Wallet = new Wallet(process.env.DEPLOY_PRIVATE_KEY || "").connect(
    provider
  );
  const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");

  const aaFactory = new ethers.Contract(
    process.env.AA_FACTORY_ADDRESS || "", // Address of your AA factory
    factoryArtifact.abi,
    deployerWallet
  );

  // The two owners of the multisig
  const owner1: Wallet = new Wallet(process.env.OWNER1_PRIVATE_KEY || ""); // Wallet.createRandom()
  const owner2: Wallet = new Wallet(process.env.OWNER2_PRIVATE_KEY || ""); // Wallet.createRandom()

  // Use a zero hash as salt
  const salt = ethers.constants.HashZero; // FIXME review SALT value for prod deployment

  //
  // 1. Create an AAccount owned by owner1 & owner2

  const tx = await aaFactory.deployAccount(
    salt,
    owner1.address,
    owner2.address
  );
  await tx.wait();

  // const factoryProxy: Contract = await hre.zkUpgrades.deployProxy(deployerWallet.zkWallet, factoryArtifact, [bytecodeHash], {
  //   initializer: "store",
  //   kind: "uups" // "transparent",
  // });

  //
  // 2. Create a multisig contract from its already deployed Factory

  const abiCoder = new ethers.utils.AbiCoder();
  const multisigAddress: string = utils.create2Address(
    aaFactory.address, // AA_FACTORY_ADDRESS,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address", "address"], [owner1.address, owner2.address])
  );
  console.info(
    `Multisig account deployed on address ${multisigAddress}\n\towner1: ${owner1.address}\n\towner2: ${owner2.address}`
  );

  //
  // 3. Send funds to the multisig account we just deployed

  console.log("Sending funds to multisig account");

  await (
    await deployerWallet.sendTransaction({
      to: multisigAddress,
      // Amount of ETH to send to the multisig
      value: ethers.utils.parseEther("0.005"),
    })
  ).wait();

  let multisigBalance: ethers.BigNumber = await provider.getBalance(multisigAddress);

  console.info(
    `Multisig account balance: ${ethers.utils.formatUnits(
      multisigBalance,
      18
    )} ETH`
  ); // multisigBalance.toString()
  
  //
  // 4. Deploy a new Account using the just deployed multisig

  const owner1Multisig2: Wallet = Wallet.createRandom();
  const owner2Multisig2: Wallet = Wallet.createRandom();

  let aaTx = await aaFactory.populateTransaction.deployAccount(
    salt,
    // These are accounts that will own the newly deployed account
    owner1Multisig2.address,
    owner2Multisig2.address
  );

  const gasLimit = await provider.estimateGas(aaTx);
  const gasPrice = await provider.getGasPrice();

  aaTx = {
    ...aaTx,
    // deploy a new account using the multisig
    from: multisigAddress,
    gasLimit: gasLimit,
    gasPrice: gasPrice,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(multisigAddress),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  //
  // 4b. Sign the Transaction & Send it

  const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

  const signature = ethers.utils.concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
    ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash)),
  ]);

  aaTx.customData = {
    ...aaTx.customData,
    customSignature: signature,
  };

  console.log(
    `The multisig's nonce before the first tx is ${await provider.getTransactionCount(
      multisigAddress
    )}`
  );

  const txResponse = await provider.sendTransaction(utils.serialize(aaTx));
  const txReceipt = await txResponse.wait();
  
  // Checking that the nonce for the account has increased
  console.log(
    `The multisig's nonce after the first tx is ${await provider.getTransactionCount(
      multisigAddress
    )}`
  );

  multisigBalance = await provider.getBalance(multisigAddress);

  console.log(
    `Multisig account balance is now: ${ethers.utils.formatUnits(
      multisigBalance,
      18
    )} ETH`
  );
}
