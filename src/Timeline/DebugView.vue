<script setup lang="ts">
import { useMarkersStore } from "./Markers/markersStore";
import { useTimelineStore } from "./timelineStore";
import { useNodeStore } from "./useNodeStore";

const timelineStore = useTimelineStore();
const nodeStore = useNodeStore();
const markersStore = useMarkersStore();
</script>

<template>
  <div
    class="font-mono text-sm fixed right-8 top-8 dark:bg-red-700 bg-red-200 flex flex-col"
  >
    <table>
      <tbody>
        <tr>
          <td>scale</td>
          <td>{{ Math.round(timelineStore.pageScale * 100) / 100 }}</td>
        </tr>
        <tr>
          <td>referenceDate</td>
          <td>{{ timelineStore.referenceDate.toISODate() }}</td>
        </tr>
        <tr>
          <td>viewportFrom</td>
          <td>
            {{
              timelineStore.pageSettings.viewportDateInterval.fromDateTime.toISODate()
            }}
          </td>
        </tr>
        <tr>
          <td>viewportTo</td>
          <td>
            {{
              timelineStore.pageSettings.viewportDateInterval.toDateTime.toISODate()
            }}
          </td>
        </tr>
        <tr>
          <td>markersFrom</td>
          <td>
            {{ markersStore.markers[0].dateTime.toISODate() }}
          </td>
        </tr>
        <tr>
          <td>markersTo</td>
          <td>
            {{
              markersStore.markers[
                markersStore.markers.length - 1
              ].dateTime.toISODate()
            }}
          </td>
        </tr>
        <tr>
          <td>sections</td>
          <td>{{ nodeStore.visibleNodes[1].length }}</td>
        </tr>
        <tr>
          <td>events</td>
          <td>{{ nodeStore.visibleNodes[0].length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
td {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
</style>
