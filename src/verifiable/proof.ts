import { Proof } from '@iden3/js-merkletree';
import { ProofType } from './constants';
import { TreeState } from '../circuits';
// State represents the state of the issuer
export interface State {
  txId?: string;
  blockTimestamp?: number;
  blockNumber?: number;
  rootOfRoots?: string;
  claimsTreeRoot?: string;
  revocationTreeRoot?: string;
  value?: string;
  status?: string;
}

// IssuerData is the data that is used to create a proof
export interface IssuerData {
  id: string;
  state: State;
  authCoreClaim?: string;
  mtp?: Proof;
  credentialStatus?: object;
}

// Iden3SparseMerkleProof JSON-LD structure
export class Iden3SparseMerkleTreeProof {
  type: ProofType;
  issuerData: IssuerData;
  mtp: Proof;
  coreClaim: string;
}

// BJJSignatureProof2021 JSON-LD BBJJSignatureProof
export class BJJSignatureProof2021 {
  type: ProofType;
  issuerData: IssuerData;
  signature: string;
  coreClaim: string;
}

// Query represents structure for query to atomic circuit
export interface ProofQuery {
  allowedIssuers?: string[];
  req?: { [key: string]: unknown };
  schema?: string; // string url
  claimId?: string;
  credentialSubjectId?: string;
  context?: string;
  type?: string;
}

export interface MerkleTreeProofWithTreeState {
  proof: Proof;
  treeState: TreeState;
}
