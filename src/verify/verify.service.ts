import { Injectable } from '@nestjs/common';
import { Horizon, rpc, xdr } from '@stellar/stellar-sdk';
import { ServerApi } from '@stellar/stellar-sdk/lib/horizon/server_api';
import CollectionPage = ServerApi.CollectionPage;
import TransactionRecord = ServerApi.TransactionRecord;
import GetSuccessfulTransactionResponse = rpc.Api.GetSuccessfulTransactionResponse;
import GetFailedTransactionResponse = rpc.Api.GetFailedTransactionResponse;
import GetMissingTransactionResponse = rpc.Api.GetMissingTransactionResponse;
import GetTransactionStatus = rpc.Api.GetTransactionStatus;

export interface AccountTransaction {
  result: xdr.TransactionResult;
  envelope: xdr.TransactionV0 | xdr.Transaction | xdr.FeeBumpTransaction;
  tx: ServerApi.TransactionRecord;
}

export interface AccountOperation {
  op: xdr.OperationBody;
  tx: AccountTransaction;
  id: number;
}

@Injectable()
export class VerifyService {
  private horizonServer: Horizon.Server;

  private rpcServer: rpc.Server;

  constructor() {
    this.horizonServer = new Horizon.Server(
      'https://horizon-testnet.stellar.org',
    );
    this.rpcServer = new rpc.Server('https://soroban-testnet.stellar.org');
  }

  async getTransactions(
    publicKey: string,
  ): Promise<(AccountTransaction | AccountOperation)[]> {
    const transactionRecords: CollectionPage<TransactionRecord> =
      await this.getTransactionsByPk(publicKey);

    const successfulRecords: ServerApi.TransactionRecord[] =
      this.getSuccessfulRecords(transactionRecords);

    const accountsTransactions: AccountTransaction[] =
      this.getAccountsTransactions(successfulRecords);

    const accountsOperations: (AccountTransaction | AccountOperation)[] =
      accountsTransactions.reduce<(AccountTransaction | AccountOperation)[]>(
        (curr: AccountTransaction[], tx: AccountTransaction) => {
          return [...curr, ...this.getAccountOperations(tx)];
        },
        Array.of<AccountOperation>(),
      );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const accountsSorobanOperations: (AccountTransaction | AccountOperation)[] =
      accountsOperations.filter(
        (operation: AccountTransaction | AccountOperation) => {
          try {
            return (
              (operation as AccountOperation).op.value() instanceof
              xdr.InvokeHostFunctionOp
            );
          } catch (e) {
            console.error(e);
            return false;
          }
        },
      );

    return accountsSorobanOperations;
  }

  private handleError() {
    return (e) => console.log(e);
  }

  private async getResponseMetaFromRpcServer(
    hash: string,
  ): Promise<
    | GetSuccessfulTransactionResponse
    | GetFailedTransactionResponse
    | GetMissingTransactionResponse
  > {
    const getResponse:
      | GetSuccessfulTransactionResponse
      | GetFailedTransactionResponse
      | GetMissingTransactionResponse =
      await this.rpcServer.getTransaction(hash);

    switch (getResponse.status) {
      case GetTransactionStatus.NOT_FOUND:
        return getResponse as unknown as GetFailedTransactionResponse;
      case GetTransactionStatus.SUCCESS:
        return getResponse as unknown as GetSuccessfulTransactionResponse;
      case GetTransactionStatus.FAILED:
        return getResponse as unknown as GetMissingTransactionResponse;
      default:
        return getResponse;
    }
  }

  private getAccountOperations(tx: AccountTransaction): AccountOperation[] {
    if (tx.envelope instanceof xdr.FeeBumpTransaction) {
      return Array.of<AccountOperation>();
    } else {
      let id = 0;
      return tx.envelope.operations().map((o) => {
        return { op: o.body(), tx, id: id++ };
      });
    }
  }

  private getTransactionsByPk(
    publicKey: string,
  ): Promise<ServerApi.CollectionPage<ServerApi.TransactionRecord>> {
    const transactions: Promise<
      ServerApi.CollectionPage<ServerApi.TransactionRecord>
    > = this.horizonServer
      .transactions()
      .forAccount(publicKey)
      .order('desc')
      .limit(200)
      .call();

    transactions.catch(this.handleError());

    return transactions;
  }

  private getAccountsTransactions(
    successfulRecords: ServerApi.TransactionRecord[],
  ): AccountTransaction[] {
    return successfulRecords.map((tx) => {
      return {
        envelope: this.getTransactionEnvelope(tx).value().tx(),
        result: this.getTransactionResult(tx),
        tx,
      };
    });
  }

  private getTransactionResult(
    tx: ServerApi.TransactionRecord,
  ): xdr.TransactionResult {
    return xdr.TransactionResult.fromXDR(tx.result_xdr, 'base64');
  }

  protected getTransactionEnvelope(
    tx: ServerApi.TransactionRecord,
  ): xdr.TransactionEnvelope {
    return xdr.TransactionEnvelope.fromXDR(tx.envelope_xdr, 'base64');
  }

  private getSuccessfulRecords(
    collectionPage: ServerApi.CollectionPage<ServerApi.TransactionRecord>,
  ): ServerApi.TransactionRecord[] {
    return collectionPage.records.filter((record) => record.successful);
  }
}
