/**
 * @class Result indicates the result of the data
 * @author https://khalilstemmler.com/articles/enterprise-typescript-nodejs/handling-errors-result-class/
 */
export class Result {
    isSuccess;
    isFailure;
    errorTitle;
    errorDescription;
    _value;
    constructor(isSuccess, errorTitle, errorDescription, value) {
        if ((isSuccess && errorTitle) || (isSuccess && errorDescription)) {
            throw new Error(`InvalidOperation: A result cannot be 
          successful and contain an error`);
        }
        if ((!isSuccess && !errorTitle) || (!isSuccess && !errorDescription)) {
            throw new Error(`InvalidOperation: A failing result 
          needs to contain an error message`);
        }
        this.isSuccess = isSuccess;
        this.isFailure = !isSuccess;
        this.errorTitle = errorTitle;
        this.errorDescription = errorDescription;
        this._value = value;
        Object.freeze(this);
    }
    getValue() {
        if (!this.isSuccess) {
            throw new Error(`Cant retrieve the value from a failed result.`);
        }
        return this._value;
    }
    static ok(value) {
        return new Result(true, undefined, undefined, value);
    }
    static fail(errorTitle, errorDescription) {
        if (typeof errorTitle === "string") {
            if (errorDescription === undefined) {
                throw `Error Description is undefined, pass it please as the second argument of Result.fail`;
            }
            return new Result(false, errorTitle, errorDescription);
        }
        return new Result(false, errorTitle.errorTitle, errorTitle.errorDescription);
    }
    static combine(results) {
        for (let result of results) {
            if (result.isFailure)
                return result;
        }
        return Result.ok();
    }
}
