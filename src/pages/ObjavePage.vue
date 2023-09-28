<template>
  <q-page>
    <div class="header-text flex flex-center">Objave</div>

    <q-btn
      @click="toggleFilters"
      style="margin-left: 30px; margin-bottom: 10px"
      color="green"
      >Filteri</q-btn
    >

    <div v-if="showFilters" class="search-container">
      <div class="filter-item">
        <label class="label-form" for="searchInput">Grad za pretragu</label>
        <input
          flat
          filled
          v-model="searchQuery"
          @input="searchPlaces"
          @focus="showSuggestions = true"
          placeholder="Odaberite grad za pretragu"
          class="input-field"
          id="searchInput"
        />

        <div
          v-if="showSuggestions && suggestions.length"
          class="suggestions-box"
        >
          <div
            v-for="place in suggestions"
            :key="place.place_id"
            @click="selectPlace(place)"
            class="suggestion-item"
          >
            {{ place.display_name }}
          </div>
        </div>
      </div>
      <div v-if="selectedPlace" class="filter-item">
        <label class="label-form" for="distance">Udaljenost</label>
        <q-input
          style="width: 300px"
          id="distance"
          v-model="selectedDistance"
          type="range"
          min="1"
          max="125"
          step="1"
        />
        <span style="margin-left: 150px">{{ selectedDistance }} km</span>
      </div>

      <div class="filter-item">
        <label class="label-form" for="komentarFilter">Komentar</label>
        <input
          class="input-field"
          v-model="komentarFilter"
          placeholder="Komentar"
          id="komentarFilter"
        />
      </div>

      <div class="filter-item">
        <label class="label-form" for="typeFilter">Tip</label>
        <select
          class="input-field"
          v-model="selectedType"
          color="white"
          id="typeFilter"
          filled
        >
          <option value="" selected>Odaberite tip</option>

          <option value="Nudim pomoć">Nudi pomoć</option>

          <option value="Tražim pomoć">Trazi pomoč</option>
        </select>
      </div>

      <div class="filter-item">
        <q-btn color="blue" style="margin-top: 15px" @click="refresh"
          >Osvježi</q-btn
        >
      </div>
    </div>

    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Korisnik</th>
            <th>Tip</th>
            <th style="cursor: pointer" @click="toggleSortOrder">
              Vrijeme
              <q-icon :name="sortOrderIcon"></q-icon>
            </th>
            <th>Komentar</th>
            <th>Kontakt</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in paginatedActivePosts"
            :key="post.id"
            @click="redirectToIndex(post.longitude, post.latitude)"
            class="table_row"
          >
            <td>{{ post.username }}</td>
            <td>{{ post.Type }}</td>
            <td>{{ formatTimestamp(post.timestamp) }}</td>
            <td>
              {{ post.komentar }}
            </td>
            <td>
              <div v-if="post.kontakt">{{ post.kontakt }}<br /></div>
              <div v-if="post.email">{{ post.email }}<br /></div>
              <div v-if="post.phoneNumber">{{ post.phoneNumber }}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" style="margin-top: 15px">
        <button @click="previousPageActive" class="pagination-button">
          &larr;
        </button>
        <div class="page-numbers">
          <button
            v-for="pageNumber in totalPagesActive"
            :key="pageNumber"
            @click="goToPageActive(pageNumber)"
            class="pagination-number"
            :class="{ active: pageNumber === currentPageActive }"
          >
            {{ pageNumber }}
          </button>
        </div>
        <button @click="nextPageActive" class="pagination-button">
          &rarr;
        </button>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase.js";
import { useRoute, useRouter } from "vue-router";
import { getDocs, collection, query, where } from "firebase/firestore";
import axios from "axios";
export default {
  setup() {
    const $q = useQuasar();

    const router = useRouter();

    const activePosts = ref([]);

    const activePostsVisible = ref(true);

    const ascending = ref(true);

    const searchQuery = ref("");
    const suggestions = ref([]);
    const selectedPlace = ref(null);

    const showFilters = ref(false);
    const selectedDistance = ref(25);
    const komentarFilter = ref("");
    const selectedType = ref("");

    const showSuggestions = ref(false);
    const sortOrder = ref("asc");

    const sortOrderIcon = computed(() => {
      return ascending.value ? "arrow_downward" : "arrow_upward";
    });

    const sortPostsByTimestamp = () => {
      const sortFactor = sortOrder.value === "asc" ? 1 : -1;
      activePosts.value.sort(
        (a, b) => sortFactor * (b.timestamp - a.timestamp)
      );
    };

    const toggleSortOrder = () => {
      sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
      ascending.value = !ascending.value;

      sortPostsByTimestamp();
    };

    function toggleFilters() {
      showFilters.value = !showFilters.value;
    }

    const currentPageActive = ref(1);

    const postsPerPage = 10;
    const totalPagesActive = computed(() => {
      return Math.ceil(activePosts.value.length / postsPerPage);
    });

    const paginatedActivePosts = computed(() => {
      const startIndex = (currentPageActive.value - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      return activePosts.value.slice(startIndex, endIndex);
    });

    const nextPageActive = () => {
      if (currentPageActive.value < totalPagesActive.value) {
        currentPageActive.value++;
      }
    };

    const previousPageActive = () => {
      if (currentPageActive.value > 1) {
        currentPageActive.value--;
      }
    };

    const goToPageActive = (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPagesActive.value) {
        currentPageActive.value = pageNumber;
      }
    };

    const fetchActivePosts = async () => {
      try {
        const postsCollectionRef = collection(db, "posts");
        const statusQuery = query(
          postsCollectionRef,
          where("status", "==", "active")
        );
        const querySnapshot = await getDocs(statusQuery);

        activePosts.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        activePosts.value.sort(
          (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
        );
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    setTimeout(() => {
      fetchActivePosts();
    }, 500);

    const redirectIndex = () => {
      router.push({ name: "IndexPage" });
    };

    return {
      activePosts,

      activePostsVisible,

      redirectIndex,

      searchQuery,
      suggestions,
      selectedPlace,

      fetchActivePosts,
      paginatedActivePosts,

      nextPageActive,
      previousPageActive,
      goToPageActive,

      totalPagesActive,

      currentPageActive,

      toggleFilters,
      showFilters,
      selectedDistance,
      komentarFilter,
      selectedType,
      showSuggestions,
      sortOrder,
      sortPostsByTimestamp,
      toggleSortOrder,
      ascending,
      sortOrderIcon,
    };
  },

  methods: {
    formatTimestamp(firestoreTimestamp) {
      const date = new Date(
        firestoreTimestamp.seconds * 1000 +
          firestoreTimestamp.nanoseconds / 1000000
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
    },

    redirectToIndex(lon, lat) {
      this.$router.push({ name: "IndexPage", query: { lon, lat } });
    },

    searchPlaces() {
      if (this.searchQuery.length >= 3) {
        axios
          .get("https://nominatim.openstreetmap.org/search", {
            params: {
              q: this.searchQuery,
              format: "json",
            },
          })
          .then((response) => {
            this.suggestions = response.data;
          })
          .catch((error) => {
            console.error("Error fetching suggestions:", error);
          });
      } else {
        this.suggestions = [];
      }
    },
    selectPlace(place) {
      this.selectedPlace = place;
      this.searchQuery = place.display_name;
      this.showSuggestions = false;
    },

    async refresh() {
      const postsCollectionRef = collection(db, "posts");

      const statusQueryActive = query(
        postsCollectionRef,
        where("status", "==", "active")
      );
      const querySnapshotActive = await getDocs(statusQueryActive);
      const activePosts = querySnapshotActive.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
      }

      let filteredActivePosts = [...activePosts];

      if (this.selectedPlace) {
        try {
          const selectedLat = parseFloat(this.selectedPlace.lat);
          const selectedLon = parseFloat(this.selectedPlace.lon);

          filteredActivePosts = filteredActivePosts.filter((post) => {
            const postLat = parseFloat(post.latitude);
            const postLon = parseFloat(post.longitude);
            const distance = calculateDistance(
              selectedLat,
              selectedLon,
              postLat,
              postLon
            );

            return distance <= this.selectedDistance;
          });
        } catch (error) {
          console.error("Error fetching and filtering posts:", error);
        }
      }

      if (this.komentarFilter) {
        filteredActivePosts = filteredActivePosts.filter((post) =>
          post.komentar.includes(this.komentarFilter)
        );
      }

      if (this.selectedType !== "") {
        filteredActivePosts = filteredActivePosts.filter(
          (post) => post.Type === this.selectedType
        );
      }

      this.activePosts = filteredActivePosts;

      this.showFilters = false;
    },
  },
};
</script>

<style scoped>
.header-text {
  margin: 0 5px 0;
  padding: 0;
  font-size: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 10px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

.custom-table th {
  background-color: #f2f2f2;
}

.custom-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.custom-table tr:hover {
  background-color: #ddd;
  cursor: pointer;
}

.custom-table th:first-child,
.custom-table td:first-child {
  text-align: left;
}

.table-container {
  max-width: 100%;
  margin: 8px 4px;

  overflow-x: auto;
}
.search-container {
  margin: 15px 30px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.filter-item {
  margin-bottom: 10px;
}

.label-form {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.input-field {
  width: 17 rem;
  padding: 10px;
}

.suggestions-box {
  width: 80%;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ccc;
  list-style: none;
}

.suggestion-item {
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid #ccc;
  transition: background-color 0.2s;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f0f0f0;
}
.pagination {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-button {
  border: none;
  cursor: pointer;
  font-size: 18px;
  margin: 0 5px;
  color: #333;
  transition: color 0.3s ease;
  background: none;
  padding: 0;
}

.pagination-button:hover {
  color: #007bff;
}

.page-numbers {
  display: flex;
  align-items: center;
}

.pagination-number {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  margin: 0 5px;
  color: #333;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.pagination-number.active {
  background-color: #007bff;
  color: #fff;
}

.pagination-number:hover {
  background-color: #007bff;
  color: #fff;
}
</style>
