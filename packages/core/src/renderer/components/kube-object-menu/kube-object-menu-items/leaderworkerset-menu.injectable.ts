/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { LeaderWorkerSetMenu } from "../../workloads-leaderworkerset/leaderworkerset-menu";
import { kubeObjectMenuItemInjectionToken } from "../kube-object-menu-item-injection-token";

import type { KubeObjectMenuItemComponent } from "../kube-object-menu-item-injection-token";

const leaderWorkerSetMenuInjectable = getInjectable({
  id: "leaderworkerset-menu-kube-object-menu",

  instantiate: () => ({
    kind: "LeaderWorkerSet",
    apiVersions: ["leaderworkerset.x-k8s.io/v1"],
    Component: LeaderWorkerSetMenu as KubeObjectMenuItemComponent,
    enabled: computed(() => true),
    orderNumber: 50,
  }),

  injectionToken: kubeObjectMenuItemInjectionToken,
});

export default leaderWorkerSetMenuInjectable;
