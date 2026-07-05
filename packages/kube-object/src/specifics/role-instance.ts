/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObject } from "../kube-object";

import type { BaseKubeObjectCondition, KubeObjectStatus, NamespaceScopedMetadata } from "../api-types";

export interface RoleInstanceComponent {
  name: string;
  size: number;
  serviceName?: string;
  template: unknown;
}

export interface RoleInstanceComponentStatus {
  name: string;
  size: number;
  availableReplicas: number;
  readyReplicas: number;
  scheduledReplicas: number;
  updatedReplicas?: number;
  updatedReadyReplicas?: number;
}

export interface RoleInstanceSpec {
  components: RoleInstanceComponent[];
  readinessGates?: Array<{ conditionType: string }>;
  readyPolicy?: string;
  restartPolicy?: string;
}

export interface RoleInstanceStatus extends KubeObjectStatus {
  collisionCount?: number;
  componentStatuses?: RoleInstanceComponentStatus[];
  conditions?: BaseKubeObjectCondition[];
  currentRevision?: string;
  labelSelector?: string;
  observedGeneration?: number;
  updateRevision?: string;
}

export class RoleInstance extends KubeObject<NamespaceScopedMetadata, RoleInstanceStatus, RoleInstanceSpec> {
  static kind = "RoleInstance";

  static namespaced = true;

  static apiBase = "/apis/workloads.x-k8s.io/v1alpha2/roleinstances";

  getComponents(): RoleInstanceComponent[] {
    return this.spec?.components ?? [];
  }

  getComponentStatus(name: string): RoleInstanceComponentStatus | undefined {
    return this.status?.componentStatuses?.find((cs) => cs.name === name);
  }

  getComponentSize(name: string): number {
    const component = this.getComponents().find((c) => c.name === name);
    return component?.size ?? 0;
  }

  getComponentReadyReplicas(name: string): number {
    return this.getComponentStatus(name)?.readyReplicas ?? 0;
  }
}
