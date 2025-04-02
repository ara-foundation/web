/**
 * @class Result indicates the result of the data
 * @author https://khalilstemmler.com/articles/enterprise-typescript-nodejs/handling-errors-result-class/
 */
export class Result<T> {
    public isSuccess: boolean;
    public isFailure: boolean
    public errorTitle?: string; 
    public errorDescription?: string;
    private _value?: T;
  
    private constructor (isSuccess: boolean, errorTitle?: string, errorDescription?: string, value?: T) {
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
  
    public getValue () : T {
      if (!this.isSuccess) {
        throw new Error(`Cant retrieve the value from a failed result.`)
      } 
  
      return this._value!;
    }
  
    public static ok<U> (value?: U) : Result<U> {
      return new Result<U>(true, undefined, undefined, value);
    }
  
    public static fail<U> (errorTitle: string, errorDescription: string): Result<U> {
      return new Result<U>(false, errorTitle, errorDescription);
    }
  
    public static combine (results: Result<any>[]) : Result<any> {
      for (let result of results) {
        if (result.isFailure) return result;
      }
      return Result.ok<any>();
    }
  }