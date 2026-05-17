/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { podListLayoutColumnInjectionToken } from "@freelensapp/list-layout";
import { getInjectable } from "@ogre-tools/injectable";
import React from "react";
import { COLUMN_PRIORITY } from "./column-priority";

import type { Pod } from "@freelensapp/kube-object";

const GPU_RESOURCE_KEY = "nvidia.com/gpu";
const columnId = "gpuRequests";

function getGpuRequests(pod: Pod): number {
  let total = 0;

  for (const container of pod.getContainers()) {
    const gpuRequest = container.resources?.requests?.[GPU_RESOURCE_KEY];

    if (gpuRequest) {
      total += parseInt(gpuRequest, 10) || 0;
    }
  }

  return total;
}

export const podsGpuColumnInjectable = getInjectable({
  id: "pods-gpu-column",
  instantiate: () => ({
    id: columnId,
    kind: "Pod",
    apiVersion: "v1",
    priority: COLUMN_PRIORITY.GPU,
    content: (pod: Pod) => {
      const total = getGpuRequests(pod);

      return <span>{total > 0 ? total : "-"}</span>;
    },
    header: { title: "GPU", className: "gpu", sortBy: columnId, id: columnId },
    sortingCallBack: (pod: Pod) => getGpuRequests(pod),
  }),
  injectionToken: podListLayoutColumnInjectionToken,
});
