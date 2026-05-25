/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { Node } from "@freelensapp/kube-object";

export const GPU_RESOURCE_KEY = "nvidia.com/gpu";

const parseGpuCapacity = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

export const isNodeReady = (node: Pick<Node, "getConditions">) =>
  node.getConditions().some((condition) => condition.type === "Ready" && condition.status === "True");

export const getNodeGpuCapacity = (node: Pick<Node, "getConditions" | "status">) => {
  if (!isNodeReady(node)) {
    return undefined;
  }

  return (
    parseGpuCapacity(node.status?.allocatable?.[GPU_RESOURCE_KEY]) ??
    parseGpuCapacity(node.status?.capacity?.[GPU_RESOURCE_KEY])
  );
};

export const canScheduleGpuWorkloadsOnNode = (node: Pick<Node, "getConditions" | "isUnschedulable" | "status">) =>
  !node.isUnschedulable() && getNodeGpuCapacity(node) !== undefined;
