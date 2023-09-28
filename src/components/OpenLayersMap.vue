<template>
  <div id="map" style="width: 100%; height: 500px"></div>
  <div id="popup" class="ol-popup">
    <a href="#" id="popup-closer" class="ol-popup-closer"></a>
    <div id="popup-content"></div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from "vue";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import { fromLonLat } from "ol/proj";
import Overlay from "ol/Overlay";
import VectorLayer from "ol/layer/Vector";
import { Icon, Style } from "ol/style";
import Point from "ol/geom/Point";
import { setEarthquakeData } from "/utils/globals.js";
import VectorSource from "ol/source/Vector";
import { db, auth } from "src/boot/firebase.js";
import { getDocs, collection, getDoc, doc } from "firebase/firestore";
import FullScreen from "ol/control/FullScreen.js";
import { useRouter } from "vue-router";
export default {
  name: "OpenLayersMap",
  props: {
    lon: String,
    lat: String,
  },
  setup(props) {
    const posts = ref([]);
    let overlay;
    const router = useRouter();
    const setupMap = async () => {
      const centerValue = ref(null);
      const zoomValue = ref(null);

      if ((props.lon && props.lat) != null) {
        centerValue.value = fromLonLat([props.lon, props.lat]);
        zoomValue.value = 16;
      } else {
        centerValue.value = fromLonLat([
          17.854144144145337, 44.220081335068045,
        ]);
        zoomValue.value = 6;
      }
      const map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],

        view: new View({
          center: centerValue.value,
          zoom: zoomValue.value,
        }),
      });

      const fullscreenControl = new FullScreen({
        source: "map",
      });

      map.addControl(fullscreenControl);

      try {
        const postsCollectionRef = collection(db, "posts");
        const querySnapshot = await getDocs(postsCollectionRef);

        posts.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error fetching posts:", error);
      }

      const pinsSource = new VectorSource();
      const pinsLayer = new VectorLayer({
        source: pinsSource,
      });

      const markerContainer = document.getElementById("popup");
      const markerContent = document.getElementById("popup-content");

      map.addLayer(pinsLayer);

      overlay = new Overlay({
        element: markerContainer,
        positioning: "bottom-center",
      });
      map.addOverlay(overlay);

      function formatFirestoreTimestamp(timestamp) {
        const date = new Date(
          timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
        );

        const options = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        };

        const formattedDate = date.toLocaleString("en-GB", options);

        return formattedDate;
      }

      posts.value.forEach((post) => {
        if (post.Type == "Nudim pomoć" && post.status == "active") {
          const iconStyle = new Style({
            image: new Icon({
              src: "src/assets/gotHelpPin.png",
              scale: 1,
              imgSize: [32, 32],
            }),
          });
          const pinFeature = new Feature({
            geometry: new Point(fromLonLat([post.longitude, post.latitude])),
            postData: post,
          });

          pinFeature.setStyle(iconStyle);
          pinsSource.addFeature(pinFeature);
        } else if (post.status == "active") {
          const iconStyle = new Style({
            image: new Icon({
              src: "src/assets/helpPin.png",
              scale: 1,
              imgSize: [32, 32],
            }),
          });
          const pinFeature = new Feature({
            geometry: new Point(fromLonLat([post.longitude, post.latitude])),
            postData: post,
          });

          pinFeature.setStyle(iconStyle);
          pinsSource.addFeature(pinFeature);
        }
      });

      const earthquakeSource = new VectorSource();
      const earthquakeLayer = new VectorLayer({
        source: earthquakeSource,
      });

      map.addLayer(earthquakeLayer);

      async function fetchEarthquakeData() {
        const endTime = new Date();
        const startTime = new Date(endTime - 48 * 60 * 60 * 1000);

        const formattedStartTime = startTime.toISOString();
        const formattedEndTime = endTime.toISOString();

        const response = await fetch(
          `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&starttime=${formattedStartTime}&endtime=${formattedEndTime}&minlatitude=33.389&maxlatitude=61.165&minlongitude=-14.27&maxlongitude=45.9`
        );
        const data = await response.json();
        return data.features;
      }

      async function displayEarthquakes() {
        earthquakeSource.clear();
        const earthquakeData = await fetchEarthquakeData();

        earthquakeData.forEach((earthquake) => {
          const coords = earthquake.geometry.coordinates;
          const magnitude = earthquake.properties.mag;
          const depth = earthquake.properties.depth;
          const time = earthquake.properties.time;
          const radius = Math.exp(magnitude / 1.01 - 0.13) * 1;

          const earthquakeFeature = new Feature({
            geometry: new Point(fromLonLat([coords[0], coords[1]])),
          });
          earthquakeFeature.set("earthquakeData", {
            magnitude: magnitude,
            depth: depth,
            date: time,
          });

          setEarthquakeData(earthquakeData);
          earthquakeSource.addFeature(earthquakeFeature);
        });
      }

      map.on("click", (event) => {
        const features = map.getFeaturesAtPixel(event.pixel);

        if (features.length > 0) {
          const selectedFeature = features[0];
          const postData = selectedFeature.get("postData");
          const earthquakeData = selectedFeature.get("earthquakeData");

          if (postData) {
            // Display post data
            const coordinates = event.coordinate;
            overlay.setPosition(coordinates);
            const vrijeme = formatFirestoreTimestamp(postData.timestamp);

            const popupContent = document.createElement("div");
            popupContent.innerHTML = `
              <strong>${postData.Type}</strong>
              <p>${postData.username}</p>
              <p>${postData.komentar}</p>
              ${postData.kontakt ? `<p>${postData.kontakt}</p>` : ""}
              ${postData.email ? `<p>${postData.email}</p>` : ""}
              ${postData.phoneNumber ? `<p>${postData.phoneNumber}</p>` : ""}
              <p>${vrijeme}</p>`;

            checkIsAdmin().then((isAdmin) => {
              if (isAdmin) {
                const adminActionButton = document.createElement("button");
                adminActionButton.textContent = "Pregledaj";
                adminActionButton.addEventListener("click", () => {
                  adminAction(postData.id);
                });
                popupContent.appendChild(adminActionButton);
              }

              markerContent.innerHTML = "";
              markerContent.appendChild(popupContent);
            });
          } else if (earthquakeData) {
            // Display earthquake data
            const coordinates = event.coordinate;
            overlay.setPosition(coordinates);

            let popupContent = "<div>";

            popupContent += `<strong>Magnituda: ${earthquakeData.magnitude}</strong>`;
            popupContent += `<p>Dubina: ${earthquakeData.depth} km</p>`;
            popupContent += `<p>Vrijeme: ${earthquakeData.date}</p>`;

            popupContent += "</div>";
            markerContent.innerHTML = popupContent;
          } else {
            overlay.setPosition(undefined);
          }
        } else {
          overlay.setPosition(undefined);
        }
      });
      displayEarthquakes();
      const checkIsAdmin = async () => {
        const user = auth.currentUser;

        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getDoc(userDocRef);

          if (userDocSnapshot.exists()) {
            if (userDocSnapshot.data().role == "admin") {
              return true;
            }
          }
        }
      };

      function adminAction(postId) {
        router.push({ name: "AdminPagePost", params: { postId } });
      }
      /* async function fetchStormsData() {
        try {
          const apiUrl = `https://eonet.gsfc.nasa.gov/api/v2.1/categories/10?days=2`;

          const response = await axios.get(apiUrl);
          const data = response.data;

          const disasters = data.events;
          const disasterSource = new VectorSource();


          const disasterLayer = new VectorLayer({
            source: disasterSource,
            style: new Style({

              fill: new Fill({
                color: "rgba(255, 0, 0, 0.15)",
              }),
              stroke: new Stroke({
                color: "red",
                width: 1,
              }),
            }),
          });

          disasters.forEach((disaster) => {

            const coordinates = disaster.geometries.map((geometry) => {
              return fromLonLat([
                geometry.coordinates[0],
                geometry.coordinates[1],
              ]);
            });


            const polygonFeature = new Feature({
              geometry: new Polygon([coordinates]),
            });


            polygonFeature.setProperties({
              title: disaster.title,
              description: disaster.description,
            });


            disasterSource.addFeature(polygonFeature);
          });


          map.addLayer(disasterLayer);
        } catch (error) {
          console.error("Error fetching disaster data:", error);
        }
      }
      fetchStormsData(); */
    };

    onMounted(() => {
      setupMap();
    });

    return {
      setupMap,
    };
  },
};
</script>

<style scoped>
.ol-attribution {
  display: none;
}
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}
.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
</style>
