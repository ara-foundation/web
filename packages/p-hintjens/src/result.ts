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
  
    public static fail<U> (errorTitle: string|{errorTitle: string, errorDescription: string}, errorDescription?: string): Result<U> {
      if (typeof errorTitle === "string") {
        if (errorDescription === undefined) {
          throw `Error Description is undefined, pass it please as the second argument of Result.fail`
        }
        return new Result<U>(false, errorTitle, errorDescription);
      }
      return new Result<U>(false, errorTitle.errorTitle, errorTitle.errorDescription);
    }

    /**
     * HTTP Code 501: Not Implemented, the method is not fully implemented
     * @param slugs 
     * @param functionPath 
     * @returns 
     */
    public static errorCode501<U>(slugs: string[], functionPath: string): Result<U> {
      const errorDescription = `The server doesn't support '${slugs.join("/")}.${functionPath}' yet, ask Medet or maintainers of Ara Web to support it`;
      return new Result<U>(false, "Error Code 501 (Not Implemented)", errorDescription);
    }

    /**
     * HTTP Code 404: Not found, but maybe in the future
     * @param slugs 
     * @param functionPath
     * @returns 
     */
    public static errorCode404<U>(slugs: string[], functionPath: string, data: string): Result<U> {
      const errorDescription = `'${slugs.join("/")}.${functionPath}' doesn't support '${data}'`;
      return new Result<U>(false, "Error Code 404 (Not found)", errorDescription);
    }

    public static combine (results: Result<any>[]) : Result<any> {
      for (let result of results) {
        if (result.isFailure) return result;
      }
      return Result.ok<any>();
    }
}

/**
 * Simple version of Result that provides error message.
 */
export class OkResult {
  public isSuccess: boolean;
  public isFailure: boolean
  public errorTitle?: string; 
  public errorDescription?: string;

  private constructor (isSuccess: boolean, errorTitle?: string, errorDescription?: string) {
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
    
    Object.freeze(this);
  }

  public static ok () : OkResult {
    return new OkResult(true, undefined, undefined);
  }

  public static fail (errorTitle: string|{errorTitle: string, errorDescription: string}, errorDescription?: string): OkResult {
    if (typeof errorTitle === "string") {
      if (errorDescription === undefined) {
        throw `Error Description is undefined, pass it please as the second argument of Result.fail`
      }
      return new OkResult(false, errorTitle, errorDescription);
    }
    return new OkResult(false, errorTitle.errorTitle, errorTitle.errorDescription);
  }
}