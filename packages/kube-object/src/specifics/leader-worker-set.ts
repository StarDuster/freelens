/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObject } from "../kube-object";

import type { BaseKubeObjectCondition, KubeObjectStatus, NamespaceScopedMetadata } from "../api-types";
import type { PodSpec } from "./pod";

export interface LeaderWorkerSetSpec {
  replicas: number;
  leaderWorkerTemplate: {
    size?: number;
    restartPolicy?: string;
    leaderTemplate?: {
      metadata?: {
        labels?: Partial<Record<string, string>>;
        annotations?: Partial<Record<string, string>>;
      };
      spec: PodSpec;
    };
    workerTemplate: {
      metadata?: {
        labels?: Partial<Record<string, string>>;
        annotations?: Partial<Record<string, string>>;
      };
      spec: PodSpec;
    };
  };
  networkConfig?: {
    subdomainPolicy?: string;
  };
  rolloutStrategy?: {
    type?: string;
    rollingUpdate?: {
      partition?: number;
      maxUnavailable?: number;
      maxSurge?: number;
    };
  };
}

export interface LeaderWorkerSetStatus extends KubeObjectStatus {
  replicas: number;
  readyReplicas: number;
  availableReplicas?: number;
  updatedReplicas?: number;
  conditions?: BaseKubeObjectCondition[];
}

export class LeaderWorkerSet extends KubeObject<NamespaceScopedMetadata, LeaderWorkerSetStatus, LeaderWorkerSetSpec> {
  static kind = "LeaderWorkerSet";

  static namespaced = true;

  static apiBase = "/apis/leaderworkerset.x-k8s.io/v1/leaderworkersets";

  getReplicas() {
    return this.spec.replicas || 0;
  }

  getReadyReplicas() {
    return this.status?.readyReplicas || 0;
  }

  getConditions() {
    return this.status?.conditions ?? [];
  }
}
