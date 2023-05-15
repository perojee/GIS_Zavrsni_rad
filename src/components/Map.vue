<template>
  <div id="map-container" style="width: 100%; height: 400px"></div>
</template>

<script>
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";

export default {
  name: "MapDetails",
  mounted() {
    const map = new Map({
      target: "map-container",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });
  },
};
</script>

<style scoped>
#map-container {
  height: 100%;
}
</style>
