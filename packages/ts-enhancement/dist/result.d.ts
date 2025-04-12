/**
 * @class Result indicates the result of the data
 * @author https://khalilstemmler.com/articles/enterprise-typescript-nodejs/handling-errors-result-class/
 */
export declare class Result<T> {
    isSuccess: boolean;
    isFailure: boolean;
    errorTitle?: string;
    errorDescription?: string;
    private _value?;
    private constructor();
    getValue(): T;
    static ok<U>(value?: U): Result<U>;
    static fail<U>(errorTitle: string | {
        errorTitle: string;
        errorDescription: string;
    }, errorDescription?: string): Result<U>;
    static combine(results: Result<any>[]): Result<any>;
}
