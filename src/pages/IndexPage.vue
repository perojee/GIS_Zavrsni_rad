<template>
  <q-page>
    <div class="row justify-between">
      <div class="col-4 q-ml-lg q-mt-md">
        <p>
          <span class="text-content">STATUS RIZIKA: </span>
          <span
            style="font-style: italic; color: rgb(89, 88, 88)"
            v-if="riskStatus == 'Nepoznato (omogućite lokaciju)'"
            class="text-under"
          >
            {{ riskStatus }}
          </span>
          <span
            style="color: rgb(13, 120, 54)"
            v-if="riskStatus == 'Sigurno'"
            class="text-under"
          >
            {{ riskStatus }}
          </span>
          <span
            style="color: rgb(158, 111, 7)"
            v-if="riskStatus == 'Mogućnost rizika'"
            class="text-under"
          >
            {{ riskStatus }}
          </span>
        </p>
      </div>

      <div class="buttons">
        <q-btn color="primary" @click="openModal">Nova objava</q-btn>
      </div>
    </div>
    <div class="map-container">
      <open-layers-map :lon="lon" :lat="lat"></open-layers-map>
    </div>
    <div class="modal-container">
      <LocationModal
        v-if="showModal"
        :showModal="showModal"
        @update:showModal="showModal = $event"
      />
    </div>
  </q-page>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount } from "vue";
import OpenLayersMap from "components/OpenLayersMap.vue";
import { ref, watchEffect, watch, toRef } from "vue";
import LocationModal from "src/components/LocationModal.vue";
import { db } from "src/boot/firebase.js";
import {
  setGlobalLatitude,
  setGlobalLongitude,
  globalLatitude,
  globalLongitude,
  clearGlobals,
  earthquakeData,
  LokacijaEnabled,
} from "/utils/globals.js";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { doc, getDocs, collection, updateDoc } from "firebase/firestore";

export default defineComponent({
  name: "IndexPage",
  components: { OpenLayersMap, LocationModal },
  props: {
    lon: String,
    lat: String,
  },
  setup(props) {
    const $q = useQuasar();
    const query = useRoute();

    const posts = ref([]);
    const isLocationEnabled = ref(LokacijaEnabled);

    const showModal = ref(false);
    const riskStatus = ref("Nepoznato (omogućite lokaciju)");
    const checkInterval = ref(null);

    const openModal = () => {
      promptToEnableLocation();
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const promptToEnableLocation = () => {
      if (!isLocationEnabled.value) {
        $q.notify({
          message: "Kako bi usluge bile dostupne morate omogućiti lokaciju",
          icon: "announcement",
        });
      } else if (!(globalLatitude.value && globalLongitude.value)) {
        $q.notify({
          message: "Molimo omogućite lokacijiske usluge na vašem uređaju",
          icon: "announcement",
        });
        isLocationEnabled.value = false;
      } else {
        showModal.value = true;
      }
    };

    const userLatitudeRef = toRef(globalLatitude, "value");
    const userLongitudeRef = toRef(globalLongitude, "value");

    const userLatitude = userLatitudeRef.value;
    const userLongitude = userLongitudeRef.value;

    async function calculateRiskEarthquakes() {
      function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
      }

      earthquakeData.value.forEach((earthquake) => {
        const radius = Math.exp(earthquake.properties.mag / 1.01 - 0.13);
        const distance = calculateDistance(
          userLatitude,
          userLongitude,
          earthquake.properties.lat,
          earthquake.properties.lon
        );

        if (distance < radius) {
          riskStatus.value = "Mogućnost rizika";
        } else {
          riskStatus.value = "Sigurno";
        }
      });
    }

    const toggleLocation = async () => {
      if (isLocationEnabled.value) {
        try {
          const position = await getLocation();
          setGlobalLongitude(position.coords.longitude);
          setGlobalLatitude(position.coords.latitude);

          console.log(
            "User location:",
            position.coords.latitude,
            position.coords.longitude
          );
        } catch (error) {
          console.error("Error getting user location:", error);
        }
      }
    };
    if (globalLatitude.value && globalLongitude.value) {
      isLocationEnabled.value = true;
    } else {
      isLocationEnabled.value = false;
    }

    const getLocation = () => {
      return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
          const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          };
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        } else {
          reject(new Error("Geolokacija nije dostupna u ovom browseru."));
        }
      });
    };

    const resetGlobals = () => {
      clearGlobals();
      riskStatus.value = "Nepoznato (omogućite lokaciju)";
    };

    watch(
      isLocationEnabled,
      (newValue) => {
        if (newValue) {
          calculateRiskEarthquakes();
          toggleLocation();
        } else {
          resetGlobals();
        }
      },
      { immediate: true }
    );

    async function checkAndMarkOldPostsInactive() {
      const currentTime = Date.now();
      const thirtySixHours = 36 * 60 * 60 * 1000;

      const postsCollectionRef = collection(db, "posts");
      const postsSnapshot = await getDocs(postsCollectionRef);

      postsSnapshot.forEach(async (posst) => {
        const post = posst.data();

        if (
          post.status === "active" &&
          post.timestamp &&
          post.timestamp.toMillis &&
          currentTime - post.timestamp.toMillis() > thirtySixHours
        ) {
          const postDocRef = doc(db, "posts", posst.id);
          await updateDoc(postDocRef, {
            status: "inactive",
          });
        }
      });
    }

    onMounted(() => {
      checkAndMarkOldPostsInactive();

      checkInterval.value = setInterval(
        checkAndMarkOldPostsInactive,
        6 * 60 * 60 * 1000
      );
    });

    onBeforeUnmount(() => {
      clearInterval(checkInterval.value);
    });

    return {
      showModal,
      isLocationEnabled,
      openModal,
      closeModal,
      resetGlobals,
      promptToEnableLocation,
      checkInterval,
      checkAndMarkOldPostsInactive,
      posts,
      riskStatus,
    };
  },
  computed: {
    isMobile() {
      return this.$q.platform.is.mobile;
    },
  },
});
</script>

<style scoped>
.text-content {
  padding: 0;
  font-size: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-under {
  padding: 0;
  font-size: 16px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
.map-container {
  margin: 0 20px 0 20px;
  border: 0.5px solid #000000;
}
#map {
  width: 100%;
  height: 500px;
}
.buttons {
  margin: 12px 20px 25px;
  color: #333;
}
.modal-container {
  position: relative;
  z-index: 4000;
}
.status-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Align items to the start (left) of the container */
}
</style>
