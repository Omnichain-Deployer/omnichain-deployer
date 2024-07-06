# Omnichain-Deployer

Hardhat plugin for deploying contracts to same addresses on EVM chains. Being built for EVM chains to make development easier on Superchains and OP Stack.

## What

Smart contract address is determined by the sender's address and a nonce. This nonce is the total transactions sent from sender. In order to deploy a smart contract on multiple chain with the same address it will be best practice to generate a new EOA account and deploy with it. 

With this plugin you can generate a fresh EOA deployer account, fund it, deploy your contract and verify them on different chains in single commands.

After deployment you can use this wallet on metamask. For ownable contracts you can interact with them.


## Installation

This is still the development environment you can test the plugin by hand.

```bash
npm install
```

## Tasks

This plugin adds several tasks to Hardhat:

### generate-deployer

`generate-deployer` generates a fresh EOA account for deploying. Logs the private key, mnemonic phrases for user to save. Asks for password encrypts it, saves it and deletes logs.

```
npx hardhat generate-deployer
```

### get-private-key

`get-private-key` logs the private key of the given wallet. Asks for the password of the wallet, decrypts it, logs it, wait for user to press Enter and deletes logs.

```
npx hardhat get-private-key --account <path to wallet>
```

### fund-deployer

`fund-deployer` calculates needed amount of gas to deploy the contract on each wanted chain then sends funds to freshly generated EOA deployer account.

```
npx hardhat fund-deployer --contract-name <name of the contract> CONSTRUCTOR_ARGS
```

### check-balances

`check-balances` checks balances of deployer and funder account and logs if required amount of balance they have.

```
npx hardhat check-balances
```

### omnichain-deploy

`omnichain-deploy` gets deployment script path as argument. Runs the deployment script on each selected chain with deployer account.

```
npx hardhat omnichain-deploy --path <Path to deploy script>
```

### omnichain-verify

`omnichain-verify` gets the deployed contract on each configured network. For this task to work successfully api keys for block explorers should be set. It runs `hardhat verify` on each network. For more information about verify configuration you can check [Hardhat docs](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)

```
npx hardhat omnichain-verify --address <Address of the deployed contract> CONSTRUCTOR_ARGS
```

### 


## Configuration

This plugin uses network configuration for determining network. Only the url for the network is required. This plugin extends the HardhatConfig with `omnichain` field. It requires the names of the wanted networks (contracts will be deployed on those networks), private key of the deployer account this should be the freshly generated EOA using `generate-deployer` and private key of an account to fund this deployer on wanted networks, this can be your personal account which has funds on each network.

For verifying contracts you need to set block explorer api keys, to learn how to do that you can check [Hardhat docs](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify).

This is an example of how to set it:

```js
module.exports = {
  networks: {
    exampleNetwork: {
      url: "url to network", 
    },
  },
  omnichain: {
    networks: ["exampleNetwork", <other wanted networks>],
    deployerAccount: <deployer account private key>,
    funderAccount: <private key of an account to fund deployer>
  },
  etherscan: {
    apiKey: {
      fraxtal: <fraxtal explorer api key>,
      optimism: <optimism explorer api key>,
    }
  },
};
```

## Usage

#### 1. First of all have a funder account which has funds on each wanted network. Then configure the hardhat.config file.

#### 2. Generating and Funding Deployer Account
- Generate Deployer Account:
Use the generate-deployer command to create and encrypt a deployer account, , copy its private key and use it in hardhat.config.

```
npx hardhat generate-deployer
```

- If private key of deployer is lost somehow run 

```
npx hardhat get-private-key --account <path to the wallet json file>
```
- Fund Deployer Account:
Deployer needs gas to deploy the contract. To fund deployer run

```
npx hardhat fund-deployer --contract-name <name of the contract> CONSTRUCTOR_ARGS
```

- Fund the deployer account and deployer is ready to deploy contracts

#### 3. Deploying Contracts

- Write Deployment Script:
Create a deployment script (e.g., deploy.js).

```
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Contract = await ethers.getContractFactory("YourContract");
  const contract = await Contract.deploy(/* constructor arguments */);

  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

-Omnichain Deploy:
To deploy contract on all chains run 

```
npx hardhat omnichain-deploy --path <Path to deploy script>
```

This will run deploy script on all chains.

#### 4. Verifying Contracts

- After deployment to verify contract on all network explorers run

```
npx hardhat omnichain-verify --address <Address of the deployed contract> CONSTRUCTOR_ARGS
```

### Conclusion
Omnichain Deployer streamlines the process of deploying and verifying smart contracts across multiple EVM-compatible networks. By automating key steps and providing a user-friendly CLI, it simplifies cross-chain dApp development, making it as straightforward as single-network deployment. Follow the steps above to implement Omnichain Deployer and enhance your multi-network development workflow.