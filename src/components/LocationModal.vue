<template>
  <div class="modal" @click.self="closeModal">
    <div class="modal-content">
      <q-card>
        <q-card-section>
          <div class="q-pa-sm">
            <div v-if="isLoggedIn">
              <div class="red-container">
                <div class="text-content">Korisničko ime:</div>
                <div class="text-under-username">
                  {{ username }}
                  <div class="text-not-visible" v-if="!usernameVisible">
                    (Nije vidljivo)
                  </div>
                </div>
              </div>

              <div class="text-content">Kontakt:</div>
              <div class="text-under">
                {{ email }}
                <div class="text-not-visible" v-if="!emailVisible">
                  (Nije vidljivo)
                </div>
              </div>
              <div v-if="phoneNumber" class="text-under">
                {{ phoneNumber }}
                <div class="text-not-visible" v-if="!phoneVisible">
                  (Nije vidljivo)
                </div>
              </div>
            </div>
            <div v-else>
              <q-input
                class="q-mb-md"
                outlined
                v-model="kontakt"
                label="Kontakt (e-mail ili broj telefona)"
              ></q-input>
            </div>
            <q-select
              class="q-mt-md q-mb-md"
              v-model="selectedOption"
              :options="options"
              label="Odaberite tip objave"
              outlined
              emit-value
              map-options
              option-value="value"
              option-label="label"
              dense
            />

            <q-input
              class="q-mb-lg"
              outlined
              v-model="komentar"
              label="Molimo opišite svrhu vaše objave."
              required
            ></q-input>

            <div id="modal-map" style="width: 100%; height: 200px"></div>
          </div>
        </q-card-section>

        <q-card-actions style="justify-content: space-between">
          <q-btn label="Natrag" color="primary" @click="closeModal" />
          <q-btn label="Objavi" color="primary" @click="objavi" />
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script>
import { useQuasar } from "quasar";
import GeoJSON from "ol/format/GeoJSON.js";
import { ref, onMounted, onBeforeUnmount } from "vue";
import Feature from "ol/Feature";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Style, Icon } from "ol/style";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { auth, db } from "src/boot/firebase.js";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { globalLatitude, globalLongitude } from "/utils/globals.js";
import { serverTimestamp } from "firebase/firestore";
import { fromLonLat, toLonLat } from "ol/proj";
export default {
  name: "LocationModal",
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();

    const mapModal = ref(null);
    const selectedOption = ref(null);
    const options = [
      { value: "Tražim pomoć", label: "Tražim pomoć" },
      { value: "Nudim pomoć", label: "Nudim pomoć" },
    ];

    const username = ref(null);
    const email = ref(null);
    const phoneNumber = ref(null);
    const komentar = ref(null);
    const kontakt = ref(null);
    const isLoggedIn = ref(false);

    const emailVisible = ref(false);
    const usernameVisible = ref(false);
    const phoneVisible = ref(false);

    const marker = ref(null);

    const markerLatitude = ref(globalLatitude.value);
    const markerLongitude = ref(globalLongitude.value);

    const updateMarkerPosition = () => {
      if (marker.value) {
        const center = mapModal.value.getView().getCenter();
        const [longitude, latitude] = toLonLat(center);
        marker.value.getGeometry().setCoordinates(center);

        markerLongitude.value = longitude;
        markerLatitude.value = latitude;
      }
    };

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          isLoggedIn.value = true;

          username.value = user.displayName;
          email.value = user.email;

          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getDoc(userDocRef);

          if (userDocSnapshot.exists()) {
            phoneNumber.value = userDocSnapshot.data().phoneNumber;
            emailVisible.value = userDocSnapshot.data().emailVisible;
            phoneVisible.value = userDocSnapshot.data().numberVisible;
            usernameVisible.value = userDocSnapshot.data().usernameVisible;
          } else {
            phoneNumber.value = null;
          }
        } catch (error) {
          console.log(error);
        }
      }
    };

    const closeModal = () => {
      emit("update:showModal", false);
    };

    const cancelOutsideClick = (event) => {
      if (event.target.classList.contains("modal")) {
        cancelReset();
      }
    };

    onMounted(() => {
      mapModal.value = new Map({
        target: "modal-map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([globalLongitude.value, globalLatitude.value]),
          zoom: 14,
        }),
      });

      marker.value = new Feature({
        labelPoint: new Point([globalLongitude.value, globalLatitude.value]),
      });
      marker.value.setGeometryName("labelPoint");

      mapModal.value.on("moveend", updateMarkerPosition);

      const image = new Icon({
        src: "src/assets/pin.png",
        imgSize: [32, 32],
        anchor: [0.5, 1],
      });
      const markerStyle = new Style({
        image: image,
      });

      marker.value.setStyle(markerStyle);

      const markerLayer = new VectorLayer({
        source: new VectorSource({
          features: [marker.value],
          format: new GeoJSON({ dataProjection: "EPSG:31982" }),
        }),
      });

      mapModal.value.addLayer(markerLayer);

      mapModal.value.updateSize();

      fetchUserData();
    });

    onBeforeUnmount(() => {
      if (mapModal.value) {
        mapModal.value.setTarget(null);
      }
    });

    const objavi = async () => {
      if (komentar.value && selectedOption.value) {
        if (isLoggedIn.value) {
          const user = auth.currentUser;
          if (user) {
            const colRef = doc(collection(db, "posts"));

            await setDoc(colRef, {
              userId: user.uid,
              username: usernameVisible.value ? username.value : "Anonimno",
              email: emailVisible.value ? email.value : null,
              phoneNumber: phoneVisible.value ? phoneNumber.value : "",
              komentar: komentar.value,
              Type: selectedOption.value,
              status: "active",
              latitude: markerLatitude.value,
              longitude: markerLongitude.value,
              timestamp: serverTimestamp(),
            });

            $q.notify({
              message: "Objava uspješno spremljena.",
              type: "positive",
            });
            closeModal();
            location.reload();
          }
        } else {
          const colRef = doc(collection(db, "posts"));

          await setDoc(colRef, {
            username: "Anonimno",
            kontakt: kontakt.value,
            komentar: komentar.value,
            Type: selectedOption.value,
            status: "active",
            latitude: markerLatitude.value,
            longitude: markerLongitude.value,
            timestamp: serverTimestamp(),
          });

          $q.notify({
            message: "Objava uspješno spremljena.",
            type: "positive",
          });

          closeModal();
          location.reload();
        }
      } else {
        $q.notify({
          message: "Molimo popunite sve obavezne informacije.",
          type: "negative",
        });
      }
    };

    return {
      closeModal,
      cancelOutsideClick,
      mapModal,
      selectedOption,
      options,
      username,
      email,
      phoneNumber,
      komentar,
      fetchUserData,
      isLoggedIn,
      updateMarkerPosition,
      marker,
      markerLatitude,
      markerLongitude,
      objavi,
      kontakt,
      emailVisible,
      usernameVisible,
      phoneVisible,
    };
  },
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-height: 700px;
  max-width: 600px;
  width: 100%;
  overflow: hidden;
}
.ol-attribution {
  display: none;
}
.text-content {
  margin: 0 5px 0;
  padding: 0;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.text-under {
  margin: 0 5px 0;
  padding: 0;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #1976d2;
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.3px;
  margin-top: 7px;
}
.text-under-username {
  padding: 0;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #1976d2;
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
.red-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.text-not-visible {
  font-style: italic;
  font-size: 13px;
  color: black;
  display: inline;
}
</style>
