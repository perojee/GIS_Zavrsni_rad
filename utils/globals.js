import { ref } from "vue";

const globalLatitude = ref(null);
const globalLongitude = ref(null);

const LokacijaEnabled = ref(false);

export function setLokacijaEnabled(Lokacija) {
  LokacijaEnabled.value = Lokacija;
}

export function setGlobalLatitude(latitude) {
  globalLatitude.value = latitude;
}

export function setGlobalLongitude(longitude) {
  globalLongitude.value = longitude;
}

export function clearGlobals() {
  globalLatitude.value = null;
  globalLongitude.value = null;
}
export const earthquakeData = ref([]);

export function setEarthquakeData(data) {
  earthquakeData.value = data;
}

export { globalLatitude, globalLongitude, LokacijaEnabled };
