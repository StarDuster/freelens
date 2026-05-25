/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Node } from "@freelensapp/kube-object";
import { canScheduleGpuWorkloadsOnNode, getNodeGpuCapacity, isNodeReady } from "./gpu-capacity";

const createNode = ({
  allocatableGpu,
  capacityGpu,
  ready = true,
  unschedulable = false,
}: {
  allocatableGpu?: string;
  capacityGpu?: string;
  ready?: boolean;
  unschedulable?: boolean;
}) =>
  new Node({
    apiVersion: "v1",
    kind: "Node",
    metadata: {
      name: "gpu-node-1",
      resourceVersion: "1",
      selfLink: "/api/v1/nodes/gpu-node-1",
      uid: "gpu-node-1",
    },
    spec: {
      unschedulable,
    },
    status: {
      allocatable: allocatableGpu ? { "nvidia.com/gpu": allocatableGpu } : undefined,
      capacity: capacityGpu ? { "nvidia.com/gpu": capacityGpu } : undefined,
      conditions: [
        {
          type: "Ready",
          status: ready ? "True" : "False",
        },
      ],
    },
  });

describe("node gpu capacity helpers", () => {
  it("uses allocatable gpu capacity for ready nodes", () => {
    const node = createNode({
      allocatableGpu: "8",
      capacityGpu: "8",
    });

    expect(isNodeReady(node)).toBe(true);
    expect(getNodeGpuCapacity(node)).toBe(8);
    expect(canScheduleGpuWorkloadsOnNode(node)).toBe(true);
  });

  it("falls back to status.capacity when allocatable is missing", () => {
    const node = createNode({
      capacityGpu: "4",
    });

    expect(getNodeGpuCapacity(node)).toBe(4);
  });

  it("does not trust gpu capacity on not ready nodes", () => {
    const node = createNode({
      allocatableGpu: "8",
      ready: false,
    });

    expect(isNodeReady(node)).toBe(false);
    expect(getNodeGpuCapacity(node)).toBeUndefined();
    expect(canScheduleGpuWorkloadsOnNode(node)).toBe(false);
  });

  it("does not count unschedulable gpu nodes as free schedulable nodes", () => {
    const node = createNode({
      allocatableGpu: "8",
      unschedulable: true,
    });

    expect(getNodeGpuCapacity(node)).toBe(8);
    expect(canScheduleGpuWorkloadsOnNode(node)).toBe(false);
  });
});
