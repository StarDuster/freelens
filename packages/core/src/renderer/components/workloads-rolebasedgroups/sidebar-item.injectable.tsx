/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { sidebarItemInjectionToken } from "@freelensapp/cluster-sidebar";
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { matchPath } from "react-router-dom";
import customResourcesRouteInjectable from "../../../common/front-end-routing/routes/cluster/custom-resources/custom-resources-route.injectable";
import navigateToCustomResourcesInjectable from "../../../common/front-end-routing/routes/cluster/custom-resources/navigate-to-custom-resources.injectable";
import currentPathInjectable from "../../routes/current-path.injectable";
import workloadsSidebarItemInjectable from "../workloads/workloads-sidebar-item.injectable";

import type { CustomResourcesPathParameters } from "../../../common/front-end-routing/routes/cluster/custom-resources/custom-resources-route.injectable";

const roleBasedGroupSidebarItemInjectable = getInjectable({
  id: "sidebar-item-rolebasedgroup",

  instantiate: (di) => {
    const navigateToCustomResources = di.inject(navigateToCustomResourcesInjectable);
    const currentPath = di.inject(currentPathInjectable);
    const route = di.inject(customResourcesRouteInjectable);

    return {
      parentId: workloadsSidebarItemInjectable.id,
      title: "RoleBasedGroups",
      onClick: () =>
        navigateToCustomResources({
          group: "workloads.x-k8s.io",
          name: "rolebasedgroups",
        }),
      isActive: computed(() => {
        const match = matchPath<CustomResourcesPathParameters>(currentPath.get(), {
          path: route.path,
          exact: true,
        });

        return match?.params.group === "workloads.x-k8s.io" && match?.params.name === "rolebasedgroups";
      }),
      isVisible: computed(() => true),
      orderNumber: 54,
    };
  },

  injectionToken: sidebarItemInjectionToken,
});

export default roleBasedGroupSidebarItemInjectable;
