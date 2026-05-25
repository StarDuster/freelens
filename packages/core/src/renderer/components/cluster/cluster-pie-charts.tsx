/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Icon } from "@freelensapp/icon";
import { Spinner } from "@freelensapp/spinner";
import { bytesToUnits, cssNames } from "@freelensapp/utilities";
import { withInjectables } from "@ogre-tools/injectable-react";
import { observer } from "mobx-react";
import { useRef } from "react";
import { getMetricLastPoints } from "../../../common/k8s-api/endpoints/metrics.api";
import requestAllNodeMetricsInjectable from "../../../common/k8s-api/endpoints/metrics.api/request-metrics-for-all-nodes.injectable";
import activeThemeInjectable from "../../themes/active.injectable";
import { PieChart } from "../chart";
import {
  canScheduleGpuWorkloadsOnNode,
  GPU_RESOURCE_KEY,
  getNodeGpuCapacity,
  isNodeReady,
} from "../nodes/gpu-capacity";
import podStoreInjectable from "../workloads-pods/store.injectable";
import clusterOverviewMetricsInjectable from "./cluster-metrics.injectable";
import { ClusterNoMetrics } from "./cluster-no-metrics";
import styles from "./cluster-pie-charts.module.scss";
import selectedMetricsTimeRangeInjectable from "./overview/selected-metrics-time-range.injectable";
import selectedNodeRoleForMetricsInjectable from "./overview/selected-node-role-for-metrics.injectable";
import { createMetricsTimeRangeKey } from "./overview/time-range-key";

import type { Node, Pod } from "@freelensapp/kube-object";

import type { IComputedValue } from "mobx";

import type { MetricData } from "../../../common/k8s-api/endpoints/metrics.api";
import type { ClusterMetricData } from "../../../common/k8s-api/endpoints/metrics.api/request-cluster-metrics-by-node-names.injectable";
import type {
  NodeMetricData,
  RequestAllNodeMetrics,
} from "../../../common/k8s-api/endpoints/metrics.api/request-metrics-for-all-nodes.injectable";
import type { IAsyncComputed } from "../../../common/utils/async-computed";
import type { LensTheme } from "../../themes/lens-theme";
import type { PieChartData } from "../chart";
import type { SelectedMetricsTimeRange } from "./overview/selected-metrics-time-range.injectable";
import type { PodStore } from "../workloads-pods/store";
import type { SelectedNodeRoleForMetrics } from "./overview/selected-node-role-for-metrics.injectable";

function createLabels(rawLabelData: [string, number | undefined][]): string[] {
  return rawLabelData.map(([key, value]) => `${key}: ${value?.toFixed(2) || "N/A"}`);
}

const checkedBytesToUnits = (value: number | undefined) => (typeof value === "number" ? bytesToUnits(value) : "N/A");

function computeGpuAllocatedByNode(pods: Pod[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const pod of pods) {
    const phase = pod.getStatusPhase();

    if (phase !== "Running") {
      continue;
    }

    const nodeName = pod.getNodeName();

    if (!nodeName) {
      continue;
    }

    for (const container of pod.getContainers()) {
      const gpuRequest = container.resources?.requests?.[GPU_RESOURCE_KEY];

      if (gpuRequest) {
        result.set(nodeName, (result.get(nodeName) ?? 0) + (parseInt(gpuRequest, 10) || 0));
      }
    }
  }

  return result;
}

function computeFreeGpuNodesCount(nodes: Node[], pods: Pod[]): number {
  const gpuAllocatedByNode = computeGpuAllocatedByNode(pods);
  let freeCount = 0;

  for (const node of nodes) {
    if (!canScheduleGpuWorkloadsOnNode(node)) {
      continue;
    }

    const allocated = gpuAllocatedByNode.get(node.getName()) ?? 0;

    if (allocated === 0) {
      freeCount++;
    }
  }

  return freeCount;
}

function createDerivedMetric(metric: MetricData, value: number): MetricData {
  return {
    ...metric,
    data: {
      ...metric.data,
      result: [
        {
          metric: { component: "derived" },
          values: [[Math.floor(Date.now() / 1000), String(value)] as [number, string]],
        },
      ],
    },
  };
}

function getLastNodeMetricValue(
  metrics: NodeMetricData | undefined,
  nodeName: string,
  metricName: keyof Pick<NodeMetricData, "gpuAllocatableCapacity" | "gpuCapacity" | "gpuRequests">,
) {
  try {
    const result = metrics?.[metricName]?.data.result.find(
      ({ metric: { node, instance, kubernetes_node } }) =>
        nodeName === node || nodeName === instance || nodeName === kubernetes_node,
    );
    const lastValue = result?.values.slice(-1)[0]?.[1];

    if (lastValue === undefined) {
      return undefined;
    }

    const parsed = parseFloat(lastValue);

    return Number.isFinite(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function buildGpuSummary(nodes: Node[], pods: Pod[], nodeMetrics: NodeMetricData | undefined) {
  const fallbackAllocatedByNode = computeGpuAllocatedByNode(pods);
  let totalCapacity = 0;
  let totalRequests = 0;
  let freeNodes = 0;

  for (const node of nodes) {
    const nodeName = node.getName();
    const capacity =
      getLastNodeMetricValue(nodeMetrics, nodeName, "gpuAllocatableCapacity") ??
      getLastNodeMetricValue(nodeMetrics, nodeName, "gpuCapacity") ??
      getNodeGpuCapacity(node);

    if (capacity === undefined || !isNodeReady(node)) {
      continue;
    }

    const allocated =
      getLastNodeMetricValue(nodeMetrics, nodeName, "gpuRequests") ?? fallbackAllocatedByNode.get(nodeName) ?? 0;

    totalCapacity += capacity;
    totalRequests += allocated;

    if (!node.isUnschedulable() && allocated === 0) {
      freeNodes++;
    }
  }

  return {
    freeNodes,
    totalCapacity,
    totalRequests,
  };
}

interface Dependencies {
  requestAllNodeMetrics: RequestAllNodeMetrics;
  selectedNodeRoleForMetrics: SelectedNodeRoleForMetrics;
  clusterOverviewMetrics: IAsyncComputed<Partial<ClusterMetricData> | undefined>;
  activeTheme: IComputedValue<LensTheme>;
  selectedMetricsTimeRange: SelectedMetricsTimeRange;
  podStore: PodStore;
}

const renderLimitWarning = () => (
  <div className="node-warning flex gap-4 items-center">
    <Icon material="info" />
    <p>Specified limits are higher than node capacity!</p>
  </div>
);

const renderCharts = (
  defaultColor: string,
  lastPoints: Partial<Record<keyof ClusterMetricData, number>>,
  freeGpuNodesCount: number,
) => {
  const {
    memoryUsage,
    memoryRequests,
    memoryAllocatableCapacity,
    memoryCapacity,
    memoryLimits,
    cpuUsage,
    cpuRequests,
    cpuAllocatableCapacity,
    cpuCapacity,
    cpuLimits,
    podUsage,
    podAllocatableCapacity,
    podCapacity,
    gpuCapacity,
    gpuAllocatableCapacity,
    gpuRequests,
  } = lastPoints;

  if (
    typeof cpuCapacity !== "number" ||
    typeof cpuAllocatableCapacity !== "number" ||
    typeof podCapacity !== "number" ||
    typeof podAllocatableCapacity !== "number" ||
    typeof memoryAllocatableCapacity !== "number" ||
    typeof memoryCapacity !== "number" ||
    typeof memoryUsage !== "number" ||
    typeof memoryRequests !== "number"
  ) {
    return null;
  }

  const cpuData: PieChartData = {
    datasets: [
      {
        data: [cpuUsage, cpuUsage ? cpuAllocatableCapacity - cpuUsage : 1],
        backgroundColor: ["#c93dce", defaultColor],
        id: "cpuUsage",
        label: "Usage",
      },
      {
        data: [cpuRequests, cpuRequests ? cpuAllocatableCapacity - cpuRequests : 1],
        backgroundColor: ["#4caf50", defaultColor],
        id: "cpuRequests",
        label: "Requests",
      },
      {
        data: [cpuLimits, Math.max(0, cpuAllocatableCapacity - (cpuLimits ?? cpuAllocatableCapacity))],
        backgroundColor: ["#00a7a0", defaultColor],
        id: "cpuLimits",
        label: "Limits",
      },
    ],
    labels: createLabels([
      ["Usage", cpuUsage],
      ["Requests", cpuRequests],
      ["Limits", cpuLimits],
      ["Allocatable Capacity", cpuAllocatableCapacity],
      ["Capacity", cpuCapacity],
    ]),
  };
  const memoryData: PieChartData = {
    datasets: [
      {
        data: [memoryUsage, memoryUsage ? memoryAllocatableCapacity - memoryUsage : 1],
        backgroundColor: ["#c93dce", defaultColor],
        id: "memoryUsage",
        label: "Usage",
      },
      {
        data: [memoryRequests, memoryRequests ? memoryAllocatableCapacity - memoryRequests : 1],
        backgroundColor: ["#4caf50", defaultColor],
        id: "memoryRequests",
        label: "Requests",
      },
      {
        data: [memoryLimits, Math.max(0, memoryAllocatableCapacity - (memoryLimits ?? memoryAllocatableCapacity))],
        backgroundColor: ["#00a7a0", defaultColor],
        id: "memoryLimits",
        label: "Limits",
      },
    ],
    labels: [
      `Usage: ${bytesToUnits(memoryUsage)}`,
      `Requests: ${bytesToUnits(memoryRequests)}`,
      `Limits: ${checkedBytesToUnits(memoryLimits)}`,
      `Allocatable Capacity: ${bytesToUnits(memoryAllocatableCapacity)}`,
      `Capacity: ${bytesToUnits(memoryCapacity)}`,
    ],
  };
  const podsData: PieChartData = {
    datasets: [
      {
        data: [podUsage, podUsage ? podAllocatableCapacity - podUsage : 1],
        backgroundColor: ["#4caf50", defaultColor],
        id: "podUsage",
        label: "Usage",
        tooltipLabels: [(percent) => `Usage: ${percent}`, (percent) => `Available: ${percent}`],
      },
    ],
    labels: [`Usage: ${podUsage || 0}`, `Capacity: ${podAllocatableCapacity}`],
  };

  const hasGpu = isNumber(gpuCapacity) && gpuCapacity > 0;
  const gpuAllocatable = gpuAllocatableCapacity ?? gpuCapacity ?? 0;
  const gpuData: PieChartData | undefined = hasGpu
    ? {
        datasets: [
          {
            data: [gpuRequests ?? 0, Math.max(0, gpuAllocatable - (gpuRequests ?? 0)) || 1],
            backgroundColor: ["#76b900", defaultColor],
            id: "gpuRequests",
            label: "Requests",
            tooltipLabels: [(percent) => `Requests: ${percent}`, (percent) => `Available: ${percent}`],
          },
        ],
        labels: [`Requests: ${gpuRequests ?? 0}`, `Capacity: ${gpuAllocatable}`],
      }
    : undefined;

  return (
    <div className="flex justify-center grow shrink-0 basis-0 gap-2">
      <div className={cssNames(styles.chart, "flex flex-col items-center grow shrink-0 basis-0")}>
        <PieChart
          data={cpuData}
          title="CPU"
          legendColors={["#c93dce", "#4caf50", "#00a7a0", "#032b4d", defaultColor]}
        />
        {(cpuLimits ?? cpuAllocatableCapacity) > cpuAllocatableCapacity && renderLimitWarning()}
      </div>
      <div className={cssNames(styles.chart, "flex flex-col items-center grow shrink-0 basis-0")}>
        <PieChart
          data={memoryData}
          title="Memory"
          legendColors={["#c93dce", "#4caf50", "#00a7a0", "#032b4d", defaultColor]}
        />
        {(memoryLimits ?? memoryAllocatableCapacity) > memoryAllocatableCapacity && renderLimitWarning()}
      </div>
      <div className={cssNames(styles.chart, "flex flex-col items-center grow shrink-0 basis-0")}>
        <PieChart data={podsData} title="Pods" legendColors={["#4caf50", defaultColor]} />
      </div>
      {hasGpu && gpuData && (
        <div className={cssNames(styles.chart, "flex flex-col items-center grow shrink-0 basis-0")}>
          <PieChart data={gpuData} title="GPU" legendColors={["#76b900", defaultColor]} />
          <div className={styles.gpuFreeNodes}>Free nodes: {freeGpuNodesCount}</div>
          {(gpuRequests ?? 0) > gpuAllocatable && renderLimitWarning()}
        </div>
      )}
    </div>
  );
};

const renderContent = (
  defaultColor: string,
  nodes: Node[],
  metrics: Partial<ClusterMetricData> | undefined,
  freeGpuNodesCount: number,
) => {
  if (!nodes.length) {
    return (
      <div className={cssNames(styles.empty, "flex flex-col grow shrink-0 basis-0 items-center justify-center")}>
        <Icon material="info" />
        No Nodes Available.
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={cssNames(styles.empty, "flex justify-center items-center grow shrink-0 basis-0")}>
        <Spinner />
      </div>
    );
  }

  const lastPoints = getMetricLastPoints(metrics);
  const { memoryCapacity, cpuCapacity, podCapacity } = lastPoints;

  if (!memoryCapacity || !cpuCapacity || !podCapacity) {
    return (
      <div className={styles.noMetrics}>
        <ClusterNoMetrics className={styles.empty} />
      </div>
    );
  }

  return renderCharts(defaultColor, lastPoints, freeGpuNodesCount);
};

const NonInjectedClusterPieCharts = observer(
  ({
    requestAllNodeMetrics,
    selectedNodeRoleForMetrics,
    clusterOverviewMetrics,
    activeTheme,
    selectedMetricsTimeRange,
    podStore,
  }: Dependencies) => {
    const currentRangeKey = createMetricsTimeRangeKey(selectedMetricsTimeRange.value.get());
    const lastResolvedRangeKeyRef = useRef<string | undefined>(undefined);
    const isPending = clusterOverviewMetrics.pending.get();

    if (!isPending) {
      lastResolvedRangeKeyRef.current = currentRangeKey;
    }

    const nodes = selectedNodeRoleForMetrics.nodes.get();
    const [nodeMetrics, setNodeMetrics] = React.useState<NodeMetricData>();

    React.useEffect(() => {
      let disposed = false;

      const refresh = async () => {
        const metrics = await requestAllNodeMetrics().catch(() => undefined);

        if (!disposed) {
          setNodeMetrics(metrics);
        }
      };

      void refresh();

      const timer = window.setInterval(() => {
        void refresh();
      }, 60_000);

      return () => {
        disposed = true;
        window.clearInterval(timer);
      };
    }, [requestAllNodeMetrics]);

    const gpuSummary = buildGpuSummary(nodes, podStore.items, nodeMetrics);
    const freeGpuNodesCount = gpuSummary.totalCapacity
      ? gpuSummary.freeNodes
      : computeFreeGpuNodesCount(nodes, podStore.items);
    const clusterMetrics =
      isPending && currentRangeKey !== lastResolvedRangeKeyRef.current ? undefined : clusterOverviewMetrics.value.get();
    const metrics =
      clusterMetrics && gpuSummary.totalCapacity
        ? {
            ...clusterMetrics,
            gpuAllocatableCapacity: createDerivedMetric(
              clusterMetrics.gpuAllocatableCapacity,
              gpuSummary.totalCapacity,
            ),
            gpuCapacity: createDerivedMetric(clusterMetrics.gpuCapacity, gpuSummary.totalCapacity),
            gpuRequests: createDerivedMetric(clusterMetrics.gpuRequests, gpuSummary.totalRequests),
          }
        : clusterMetrics;

    return (
      <div className="flex">
        {renderContent(activeTheme.get().colors.pieChartDefaultColor, nodes, metrics, freeGpuNodesCount)}
      </div>
    );
  },
);

export const ClusterPieCharts = withInjectables<Dependencies>(NonInjectedClusterPieCharts, {
  getProps: (di) => ({
    activeTheme: di.inject(activeThemeInjectable),
    clusterOverviewMetrics: di.inject(clusterOverviewMetricsInjectable),
    requestAllNodeMetrics: di.inject(requestAllNodeMetricsInjectable),
    selectedNodeRoleForMetrics: di.inject(selectedNodeRoleForMetricsInjectable),
    selectedMetricsTimeRange: di.inject(selectedMetricsTimeRangeInjectable),
    podStore: di.inject(podStoreInjectable),
  }),
});
