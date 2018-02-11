export interface CoinOrderModel {
    id: string;
    createdAt: string;
    coinAmount: number
    idCoinType: number
    idTransactionState: number
    idTransactionType: number
    idUser: number
    remainingCoinAmout: number;
}
