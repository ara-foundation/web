import type { Result } from "@ara-web/p-hintjens";
import type { SDSServiceInterface } from "@ara-web/sds";

export interface ReflectInterface extends SDSServiceInterface {
    get?<T>(moduleCategory: string): Promise<Result<T[]>>;
}