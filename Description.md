# Omnichain-Deployer

Introducing Omnichain Deployer, a hardhat plugin simplifying the deployment of contracts across multiple networks, including Superchains, OP Stacks and any EVM-compatible network, with just a few commands.

To facilitate cross-chain dApp development, Omnichain Deployer ensures contracts are deployed to the exact same addresses on each network, reducing confusion for both developers and users. Here's how it works:

- Generate Deployer Account: Use the "generate-deployer" command to create a deployer EOA (Externally Owned Account). This account is encrypted and saved as a .json file, ready to be used by browser wallet applications like Metamask.
- Fund Deployer Account: With the "fund-deployer" command, developers can fund the deployer account on multiple networks. This command requires contract and constructor arguments as input, calculates the necessary gas, and sends the funds to the deployer account. A funder account needs to be defined in the configuration file for this to work.
- Omnichain Deploy: Execute the "omnichain-deploy" command to deploy contracts across all configured networks. This command runs the usual deployment script provided by the developer on the desired networks.
- Contract Verification: After deployment, developers can verify their contracts on all relevant explorers using the "omnichain-verify" command.
- Additionally, developers can utilize the "check-balances" and "get-private-key" commands for further functionalities.

By following this approach, developers can write their deployment script once and deploy it across multiple networks effortlessly. Omnichain Deployer makes deploying dApps across multiple chains as straightforward as deploying on a single network.

### How it's Made

This project utilizes the Hardhat Runtime Environment for deploying and verifying smart contracts, along with the ethers library for various tasks such as estimating deployment gas, sending funds, checking balances, generating accounts, and encrypting/decrypting them. It's a command-line tool and relies on 'chalk' and 'prompt-sync' for user interaction, such as asking for passwords, logging, and displaying error messages.

Changing the network on the Hardhat Runtime Environment during runtime posed some challenges. While sending funds didn't involve HRE directly, deployment and verification tasks required constant network changes. Directly manipulating hre.network didn't work, so an alternative approach was taken using hre.hardhatArguments to change the network for deployment and running terminal commands with 'child_process' for verifying.

To calculate deployment costs, several pieces of information were needed: the gas required for the transaction and the gas price. This was achieved by using the ethers library. Contract and constructor arguments were taken as inputs, a deployment transaction was generated, and the gas estimation was extracted from this data. The gas price was obtained from the provider of the network to be deployed to, using fee data. To ensure successful deployment transactions, 1.5 times the deployment cost was declared to be sent from the developer's funder account to the deployer account.

### Technical Description
Omnichain Deployer is a robust Hardhat plugin designed to facilitate the deployment and verification of smart contracts across multiple EVM-compatible networks, including Layer 2 solutions. It leverages several key libraries and tools to provide a seamless, automated deployment process.

#### Core Components and Technologies:

- Hardhat Runtime Environment (HRE):

Utilized for deploying and verifying smart contracts.
Manages the deployment scripts and network configurations.

- Ethers Library:

Handles gas estimation, fund transfers, balance checks, account generation, and encryption/decryption of accounts.
Provides functionalities to create deployment transactions and calculate necessary gas costs.

- Chalk and Prompt-Sync:

Enhances user interaction through command-line interface (CLI) tools.
Facilitates password prompts, logging, and error message displays.

#### Key Features and Commands:

- Generate Deployer Account:

Command: generate-deployer
Generates an encrypted deployer EOA account, saved as a .json file.
Account can be imported into browser wallet applications like Metamask.

- Fund Deployer Account:

Command: fund-deployer
Accepts contract and constructor arguments as inputs.
Calculates gas required for deployment and the current gas price.
Sends 1.5 times the deployment cost from the developer’s funder account to the deployer account.
Requires a funder account defined in the configuration file.

- Omnichain Deploy:

Command: omnichain-deploy
Uses the provided deployment script to deploy contracts across all configured networks.
Automatically switches networks and executes the deployment script on each.

- Contract Verification:

Command: omnichain-verify
Verifies deployed contracts on all relevant network explorers.

- Additional Commands:

check-balances: Checks the balances of accounts across networks.
get-private-key: Retrieves the private key of the deployer account.
Deployment Process:

#### Network Management:

- Overcomes runtime network change challenges by utilizing hre.hardhatArguments to switch networks.
- Uses 'child_process' to run terminal commands for verification tasks.

#### Cost Calculation:

- Utilizes ethers library to estimate gas and obtain current gas prices from network providers.
- Ensures sufficient funds for deployment by calculating and sending 1.5 times the estimated deployment cost.

Omnichain Deployer integrates seamlessly with existing Hardhat and ethers workflows, providing a streamlined solution for multi-network smart contract deployment. By automating key processes, it reduces manual effort, minimizes errors, and enhances the efficiency and reliability of cross-chain dApp development.