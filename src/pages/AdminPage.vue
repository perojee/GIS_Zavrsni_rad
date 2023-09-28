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
    <div class="tabs">
      <input
        type="radio"
        id="radio-1"
        name="tabs"
        checked
        @change="showActivePosts"
      />

      <label class="tab" for="radio-1">Aktivne</label>
      <input
        type="radio"
        name="tabs"
        id="radio-2"
        @change="showInactivePosts"
      />

      <label class="tab" for="radio-2">Neaktivne</label>
      <span class="glider"></span>
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
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody v-if="activePostsVisible">
          <tr v-for="post in paginatedActivePosts" :key="post.id">
            <td>{{ post.username }}</td>
            <td>{{ post.Type }}</td>
            <td>{{ formatTimestamp(post.timestamp) }}</td>
            <td @click="startEditing(post)">
              <template v-if="isEditing && editingPostId === post.id">
                <input
                  v-model="editedKomentar"
                  @blur="saveChanges(post)"
                  @keyup.enter="saveChanges(post)"
                />
              </template>
              <template v-else>
                {{ post.komentar }}
              </template>
            </td>
            <td>
              <div v-if="post.kontakt">{{ post.kontakt }}<br /></div>
              <div v-if="post.email">{{ post.email }}<br /></div>
              <div v-if="post.phoneNumber">{{ post.phoneNumber }}</div>
            </td>

            <td>
              <q-btn
                push
                class="button-style"
                @click="deletePost(post.id)"
                style="background: rgba(255, 0, 0, 0.748)"
              >
                Izbriši
              </q-btn>
              <q-btn
                push
                class="button-style"
                @click="ugasiPost(post.id)"
                style="background: rgba(5, 70, 167, 0.542)"
              >
                Onemogući
              </q-btn>
            </td>
          </tr>
        </tbody>

        <tbody v-if="inactivePostsVisible">
          <tr v-for="post in paginatedInactivePosts" :key="post.id">
            <td>{{ post.username }}</td>
            <td>{{ post.Type }}</td>
            <td>{{ formatTimestamp(post.timestamp) }}</td>
            <td>{{ post.komentar }}</td>
            <td>
              <div v-if="post.kontakt">{{ post.kontakt }}<br /></div>
              <div v-if="post.email">{{ post.email }}<br /></div>
              <div v-if="post.phoneNumber">{{ post.phoneNumber }}</div>
            </td>

            <td>
              <q-btn
                push
                class="button-style"
                @click="deletePost(post.id)"
                style="background: rgba(255, 0, 0, 0.748)"
              >
                Izbriši
              </q-btn>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        class="pagination"
        style="margin-top: 15px"
        v-if="activePostsVisible"
      >
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

      <div
        class="pagination"
        style="margin-top: 15px"
        v-if="inactivePostsVisible"
      >
        <button @click="previousPageInactive" class="pagination-button">
          &larr;
        </button>
        <div class="page-numbers">
          <button
            v-for="pageNumber in totalPagesInactive"
            :key="pageNumber"
            @click="goToPageInactive(pageNumber)"
            class="pagination-number"
            :class="{ active: pageNumber === currentPageInactive }"
          >
            {{ pageNumber }}
          </button>
        </div>
        <button @click="nextPageInactive" class="pagination-button">
          &rarr;
        </button>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useQuasar } from "quasar";
import { auth, db } from "src/boot/firebase.js";
import { useRouter } from "vue-router";
import {
  doc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import axios from "axios";
export default {
  props: {
    postId: String,
  },
  setup(props) {
    const $q = useQuasar();

    const router = useRouter();

    const activePosts = ref([]);
    const inactivePosts = ref([]);
    const activePostsVisible = ref(true);
    const inactivePostsVisible = ref(false);

    const ascending = ref(true);

    const isEditing = ref(false);
    const editingPostId = ref(null);
    const editedKomentar = ref("");

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
        (a, b) => sortFactor * (a.timestamp - b.timestamp)
      );
      inactivePosts.value.sort(
        (a, b) => sortFactor * (a.timestamp - b.timestamp)
      );
    };

    const toggleSortOrder = () => {
      sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
      ascending.value = !ascending.value;
      console.log(ascending.value);
      sortPostsByTimestamp();
    };

    function toggleFilters() {
      showFilters.value = !showFilters.value;
      console.log(showFilters.value);
    }

    const showActivePosts = () => {
      activePostsVisible.value = true;
      inactivePostsVisible.value = false;
    };

    const showInactivePosts = () => {
      activePostsVisible.value = false;
      inactivePostsVisible.value = true;
    };

    const currentPageActive = ref(1); // Current page for active posts
    const currentPageInactive = ref(1); // Current page for inactive posts
    const postsPerPage = 10; // Number of posts per page

    const totalPagesActive = computed(() => {
      return Math.ceil(activePosts.value.length / postsPerPage);
    });

    const totalPagesInactive = computed(() => {
      return Math.ceil(inactivePosts.value.length / postsPerPage);
    });

    const paginatedActivePosts = computed(() => {
      const startIndex = (currentPageActive.value - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      return activePosts.value.slice(startIndex, endIndex);
    });

    const paginatedInactivePosts = computed(() => {
      const startIndex = (currentPageInactive.value - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      return inactivePosts.value.slice(startIndex, endIndex);
    });

    // Pagination methods for active posts
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

    // Pagination methods for inactive posts
    const nextPageInactive = () => {
      if (currentPageInactive.value < totalPagesInactive.value) {
        currentPageInactive.value++;
      }
    };

    const previousPageInactive = () => {
      if (currentPageInactive.value > 1) {
        currentPageInactive.value--;
      }
    };

    const goToPageInactive = (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPagesInactive.value) {
        currentPageInactive.value = pageNumber;
      }
    };

    const deletePost = async (postId) => {
      try {
        checkIsAdmin();
        const postCollectionRef = doc(db, "posts", postId);

        await deleteDoc(postCollectionRef);

        location.reload();
        $q.notify({
          message: "Uspješno izbrisana objava",
          type: "positive",
        });
      } catch (error) {
        console.log("Neuspješno brisanje", error);
      }
    };

    const ugasiPost = async (postId) => {
      try {
        checkIsAdmin();
        const postCollectionRef = doc(db, "posts", postId);
        await updateDoc(postCollectionRef, {
          status: "inactive",
        });
        location.reload();
      } catch (error) {
        console.log("neuspješno", error);
      }
    };

    async function fetchActivePosts() {
      try {
        const postsCollectionRef = collection(db, "posts");
        const statusQuery = query(
          postsCollectionRef,
          where("status", "==", "inactive")
        );
        const querySnapshot = await getDocs(statusQuery);

        inactivePosts.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        inactivePosts.value.sort(
          (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
        );
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }

    const fetchInActivePosts = async () => {
      try {
        const postId = props.postId;
        if (postId) {
          const postDocRef = doc(db, "posts", postId);
          const postDocSnapshot = await getDoc(postDocRef);

          if (postDocSnapshot.exists()) {
            const post = {
              id: postDocSnapshot.id,
              ...postDocSnapshot.data(),
            };
            activePosts.value = [post];
          }
        } else {
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
            (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
          );
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    setTimeout(() => {
      checkIsAdmin();

      fetchActivePosts();

      fetchInActivePosts();
    }, 500);

    const redirectIndex = () => {
      router.push({ name: "IndexPage" });
    };

    const checkIsAdmin = async () => {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          if (!(userDocSnapshot.data().role == "admin")) {
            redirectIndex();
          }
        } else {
          redirectIndex();
        }
      } else {
        redirectIndex();
      }
    };

    return {
      activePosts,
      inactivePosts,
      activePostsVisible,
      inactivePostsVisible,
      showActivePosts,
      showInactivePosts,
      deletePost,
      ugasiPost,
      checkIsAdmin,
      redirectIndex,
      isEditing,
      editingPostId,
      editedKomentar,
      searchQuery,
      suggestions,
      selectedPlace,
      fetchActivePosts,
      fetchInActivePosts,
      paginatedActivePosts,
      paginatedInactivePosts,
      nextPageActive,
      previousPageActive,
      goToPageActive,
      nextPageInactive,
      previousPageInactive,
      goToPageInactive,
      totalPagesActive,
      totalPagesInactive,
      currentPageActive,
      currentPageInactive,
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
    async startEditing(post) {
      console.log("test");
      setTimeout(() => {
        this.isEditing = true;
        this.editingPostId = post.id;
        this.editedKomentar = post.komentar;
      }, 125);
    },
    async saveChanges(post) {
      try {
        if (this.editingPostId) {
          const postRef = doc(db, "posts", this.editingPostId);
          await updateDoc(postRef, {
            komentar: this.editedKomentar,
          });

          post.komentar = this.editedKomentar;
        }
        this.editingPostId = null;
        this.isEditing = false;
      } catch (error) {
        console.error("Error updating Firestore document:", error);
      }
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
      console.log(this.showSuggestions);
    },

    async refresh() {
      const postsCollectionRef = collection(db, "posts");

      // Fetch active posts
      const statusQueryActive = query(
        postsCollectionRef,
        where("status", "==", "active")
      );
      const querySnapshotActive = await getDocs(statusQueryActive);
      const activePosts = querySnapshotActive.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch inactive posts
      const statusQueryInactive = query(
        postsCollectionRef,
        where("status", "==", "inactive")
      );
      const querySnapshotInactive = await getDocs(statusQueryInactive);
      const inactivePosts = querySnapshotInactive.docs.map((doc) => ({
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
      let filteredInactivePosts = [...inactivePosts];

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

          filteredInactivePosts = filteredInactivePosts.filter((post) => {
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

        filteredInactivePosts = filteredInactivePosts.filter((post) =>
          post.komentar.includes(this.komentarFilter)
        );
      }

      if (this.selectedType !== "") {
        filteredActivePosts = filteredActivePosts.filter(
          (post) => post.Type === this.selectedType
        );
        filteredInactivePosts = filteredInactivePosts.filter(
          (post) => post.Type === this.selectedType
        );
      }

      this.activePosts = filteredActivePosts;
      this.inactivePosts = filteredInactivePosts;
      this.showFilters = false;
    },
  },
};
</script>

<style>
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

:root {
  --primary-color: #fff;
  --secondary-color: #383838;
}
.tabs {
  height: 60px;
  display: flex;
  position: relative;
  background-color: #fff;
  box-shadow: 0 0 1px 0 rgba(24, 94, 224, 0.15),
    0 6px 12px 0 rgba(24, 94, 224, 0.15);
  padding: 0.75rem;
  border-radius: 99px;
  width: 320px;
  margin: auto;
}
.tabs * {
  z-index: 2;
}

input[type="radio"] {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  width: 150px;
  font-size: 1.25rem;
  font-weight: 500;
  border-radius: 99px;
  cursor: pointer;
  transition: color 0.15s ease-in;
}
.glider {
  position: absolute;
  display: flex;
  height: 38px;
  width: 150px;
  background-color: var(--secondary-color);
  z-index: 1;
  border-radius: 99px;
  transition: 0.25s ease-in;
}

input[type="radio"]:checked + label {
  color: var(--primary-color);
}

input[id="radio-1"]:checked ~ .glider {
  transform: translateX(0);
}
input[id="radio-2"]:checked ~ .glider {
  transform: translateX(100%);
}

.button-style {
  width: auto;
  margin-bottom: 3px;
}
.button-kontainer {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 6px;
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
}

.custom-table th:first-child,
.custom-table td:first-child {
  text-align: left;
}

.custom-table .button-style {
  background-color: rgba(255, 0, 0, 0.748);
  margin-right: 5px;
  color: white;
}

.custom-table .button-style:hover {
  background-color: rgba(200, 0, 0, 0.748);
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
  color: #007bff; /* Change to your desired hover color */
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
  background-color: #007bff; /* Change to your desired active background color */
  color: #fff; /* Change to your desired active text color */
}

.pagination-number:hover {
  background-color: #007bff; /* Change to your desired hover background color */
  color: #fff; /* Change to your desired hover text color */
}
</style>
