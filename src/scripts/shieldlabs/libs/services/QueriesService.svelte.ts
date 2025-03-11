import type { zklogin } from "@scripts/shieldlabs/sdk";

export class QueriesService {
  constructor(
    readonly authProvider: zklogin.GoogleProvider,
  ) {}

  async jwt() {
    return await this.authProvider.getJwt() ?? null;
  }

  async invalidateAll() {
    await this.queryClient.invalidateQueries();
  }
}
