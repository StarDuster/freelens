/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObject } from "../kube-object";

import type { BaseKubeObjectCondition, KubeObjectStatus, NamespaceScopedMetadata } from "../api-types";

export interface RoleBasedGroupRole {
  name: string;
  replicas: number;
  minReadySeconds?: number;
  podManagementPolicy?: string;
  restartPolicy?: string;
  rolloutStrategy?: {
    type?: string;
    rollingUpdate?: {
      maxSurge?: number;
      maxUnavailable?: number;
      partition?: number;
    };
  };
}

export interface RoleBasedGroupRoleStatus {
  name: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas?: number;
  updatedReplicas?: number;
  conditions?: BaseKubeObjectCondition[];
}

export interface RoleBasedGroupSpec {
  roles: RoleBasedGroupRole[];
  roleTemplates?: unknown[];
}

export interface RoleBasedGroupStatus extends KubeObjectStatus {
  observedGeneration?: number;
  conditions?: BaseKubeObjectCondition[];
  roleStatuses?: RoleBasedGroupRoleStatus[];
}

export class RoleBasedGroup extends KubeObject<NamespaceScopedMetadata, RoleBasedGroupStatus, RoleBasedGroupSpec> {
  static kind = "RoleBasedGroup";

  static namespaced = true;

  static apiBase = "/apis/workloads.x-k8s.io/v1alpha2/rolebasedgroups";

  getRoles(): RoleBasedGroupRole[] {
    return this.spec.roles ?? [];
  }

  getRoleStatus(name: string): RoleBasedGroupRoleStatus | undefined {
    return this.status?.roleStatuses?.find((rs) => rs.name === name);
  }

  getRoleReplicas(name: string): number {
    const role = this.getRoles().find((r) => r.name === name);
    return role?.replicas ?? 0;
  }

  getRoleReadyReplicas(name: string): number {
    return this.getRoleStatus(name)?.readyReplicas ?? 0;
  }
}
