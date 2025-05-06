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
    /**
     * HTTP Code 501: Not Implemented, the method is not fully implemented
     * @param slugs
     * @param functionPath
     * @returns
     */
    static errorCode501<U>(slugs: string[], functionPath: string): Result<U>;
    /**
     * HTTP Code 404: Not found, but maybe in the future
     * @param slugs
     * @param functionPath
     * @returns
     */
    static errorCode404<U>(slugs: string[], functionPath: string, data: string): Result<U>;
    static combine(results: Result<unknown>[]): Result<unknown>;
}
/**
 * Simple version of Result that provides error message.
 */
export declare class OkResult {
    isSuccess: boolean;
    isFailure: boolean;
    errorTitle?: string;
    errorDescription?: string;
    private constructor();
    static ok(): OkResult;
    static fail(errorTitle: string | {
        errorTitle: string;
        errorDescription: string;
    }, errorDescription?: string): OkResult;
}
