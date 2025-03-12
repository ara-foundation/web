import type { zklogin } from "@shield-labs/zklogin";

export class QueriesService {
  constructor(
    readonly authProvider: zklogin.GoogleProvider,
  ) {}

  async jwt() {
    return await this.authProvider.getJwt() ?? null;
  }

}
