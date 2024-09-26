import { RevocationStatus, Issuer } from '../../verifiable';
import { Contract, JsonRpcProvider, Signer, TransactionReceipt, TransactionRequest } from 'ethers';
import { Proof, NodeAuxJSON, Hash } from '@iden3/js-merkletree';
import { EthConnectionConfig } from './state';
import abi from '../blockchain/abi/CredentialStatusResolver.json';
import { ITransactionService, TransactionService } from '../../blockchain';

/**
 * OnChainRevocationStore is a class that allows to interact with the onchain contract
 * and build the revocation status.
 *
 * @public
 * @class OnChainIssuer
 */
export class OnChainRevocationStorage {
  private readonly _contract: Contract;
  private readonly _provider: JsonRpcProvider;
  private readonly _transactionService: ITransactionService;

  /**
   *
   * Creates an instance of OnChainIssuer.
   * @public
   * @param {string} - onchain contract address
   * @param {string} - rpc url to connect to the blockchain
   */

  constructor(
    private readonly _config: EthConnectionConfig,
    contractAddress: string,
    private _signer?: Signer
  ) {
    this._provider = new JsonRpcProvider(_config.url);
    let contract = new Contract(contractAddress, abi, this._provider);
    if (this._signer) {
      this._signer = this._signer.connect(this._provider);
      contract = contract.connect(this._signer) as Contract;
    }
    this._contract = contract;
    this._transactionService = new TransactionService(this._provider);
  }

  /**
   * Get revocation status by issuerId, issuerState and nonce from the onchain.
   * @public
   * @returns Promise<RevocationStatus>
   */
  public async getRevocationStatusByIdAndState(
    issuerID: bigint,
    state: bigint,
    nonce: number
  ): Promise<RevocationStatus> {
    const response = await this._contract.getRevocationStatusByIdAndState(issuerID, state, nonce);

    const issuer = OnChainRevocationStorage.convertIssuerInfo(response.issuer);
    const mtp = OnChainRevocationStorage.convertSmtProofToProof(response.mtp);

    return {
      issuer,
      mtp
    };
  }

  /**
   * Get revocation status by nonce from the onchain contract.
   * @public
   * @returns Promise<RevocationStatus>
   */
  public async getRevocationStatus(issuerID: bigint, nonce: number): Promise<RevocationStatus> {
    const response = await this._contract.getRevocationStatus(issuerID, nonce);

    const issuer = OnChainRevocationStorage.convertIssuerInfo(response.issuer);
    const mtp = OnChainRevocationStorage.convertSmtProofToProof(response.mtp);

    return {
      issuer,
      mtp
    };
  }

  public async saveNodes(payload: bigint[][]): Promise<TransactionReceipt> {
    if (!this._signer) {
      throw new Error('No signer provided');
    }
    const feeData = await this._provider.getFeeData();

    const maxFeePerGas = this._config.maxFeePerGas
      ? BigInt(this._config.maxFeePerGas)
      : feeData.maxFeePerGas;
    const maxPriorityFeePerGas = this._config.maxPriorityFeePerGas
      ? BigInt(this._config.maxPriorityFeePerGas)
      : feeData.maxPriorityFeePerGas;

    let gasLimit = BigInt(300000);
    try {
      gasLimit = await this._contract.saveNodes.estimateGas(payload);
    } catch (e) {
      const errMsg =
        (e as { error: { message: string } })?.error?.message ??
        (e as Error).message ??
        (e as string);
      if (!errMsg.includes('exceeds block gas limit')) throw e;
      
      console.log('estimation failed, using fallback gasLimit: 300000');
    }

    const txData = await this._contract.saveNodes.populateTransaction(payload);

    const request: TransactionRequest = {
      to: txData.to,
      data: txData.data,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas
    };

    let receipt: TransactionReceipt;
    try {
      receipt = (await this._transactionService.sendTransactionRequest(this._signer, request))
        .txnReceipt;
    } catch (e) {
      const errMsg =
        (e as { error: { message: string } })?.error?.message ??
        (e as Error).message ??
        (e as string);
      if (!errMsg.includes('exceeds block gas limit')) throw e;
      request.nonce = (request.nonce ?? 0) + 1;
      request.gasLimit = gasLimit * BigInt(30);
      request.maxFeePerGas = maxFeePerGas ? maxFeePerGas * BigInt(30) : null;
      request.maxPriorityFeePerGas = maxPriorityFeePerGas
        ? maxPriorityFeePerGas * BigInt(30)
        : null;
      receipt = (await this._transactionService.sendTransactionRequest(this._signer, request))
        .txnReceipt;
    }
    return receipt;
  }

  private static convertIssuerInfo(issuer: bigint[]): Issuer {
    const [state, claimsTreeRoot, revocationTreeRoot, rootOfRoots] = issuer.map((i) =>
      Hash.fromBigInt(i).hex()
    );
    return {
      state,
      claimsTreeRoot,
      revocationTreeRoot,
      rootOfRoots
    };
  }

  private static convertSmtProofToProof(mtp: {
    existence: boolean;
    auxIndex: bigint;
    auxValue: bigint;
    auxExistence: boolean;
    siblings: bigint[];
  }): Proof {
    let nodeAux: NodeAuxJSON | undefined = undefined;
    const siblings = mtp.siblings?.map((s) => s.toString());

    if (mtp.auxExistence) {
      nodeAux = {
        key: mtp.auxIndex.toString(),
        value: mtp.auxValue.toString()
      };
    }

    return Proof.fromJSON({ existence: mtp.existence, node_aux: nodeAux, siblings });
  }
}
