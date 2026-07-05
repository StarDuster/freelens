/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { RoleInstanceSet } from "@freelensapp/kube-object";
import { KubeApi } from "../kube-api";

import type { DerivedKubeApiOptions, KubeApiDependencies, NamespacedResourceDescriptor } from "../kube-api";

export class RoleInstanceSetApi extends KubeApi<RoleInstanceSet> {
  constructor(deps: KubeApiDependencies, opts?: DerivedKubeApiOptions) {
    super(deps, {
      ...(opts ?? {}),
      objectConstructor: RoleInstanceSet,
    });
  }

  async getReplicas(params: NamespacedResourceDescriptor): Promise<number> {
    const { status } = await this.getResourceScale(params);

    return status.replicas;
  }

  scale(params: NamespacedResourceDescriptor, replicas: number) {
    return this.scaleResource(params, { spec: { replicas } });
  }
}
