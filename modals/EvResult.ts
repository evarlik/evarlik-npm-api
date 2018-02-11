export interface EvResult<T> {
    exception: string;
    isSuccess: boolean;
    message: string;
    objectId: number;
    status: number;
    data: T;
}

export class EvResult<T> {
    exception: string;
    isSuccess: boolean;
    message: string;
    objectId: number;
    status: number;
    data: T;
}
