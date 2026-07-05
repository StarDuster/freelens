/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObject } from "../kube-object";

import type { BaseKubeObjectCondition, KubeObjectStatus, NamespaceScopedMetadata } from "../api-types";

export interface RoleInstanceSetSpec {
  replicas: number;
}

export interface RoleInstanceSetStatus extends KubeObjectStatus {
  replicas: number;
  readyReplicas: number;
  availableReplicas?: number;
  updatedReplicas?: number;
  conditions?: BaseKubeObjectCondition[];
}

export class RoleInstanceSet extends KubeObject<NamespaceScopedMetadata, RoleInstanceSetStatus, RoleInstanceSetSpec> {
  static kind = "RoleInstanceSet";

  static namespaced = true;

  static apiBase = "/apis/workloads.x-k8s.io/v1alpha2/roleinstancesets";

  getReplicas() {
    return this.spec?.replicas || 0;
  }

  getReadyReplicas() {
    return this.status?.readyReplicas || 0;
  }

  getConditions() {
    return this.status?.conditions ?? [];
  }
}
