<template>
  <q-layout>
    <q-header class="q-pa-md q-gutter-y-sm">
      <q-toolbar>
        <img
          src="src/assets/earth-grid.png"
          v-if="isMobile"
          class="image-mobile"
          alt=""
        />
        <img src="src/assets/earth-grid.png" v-else class="image" alt="" />

        <div class="q-ml-auto">
          <div v-if="isMobile">
            <q-toggle
              v-model="Lokacija"
              class="q-ml-xl"
              checked-icon="img:src/assets/lokacija-toggle-ikona.svg"
              color="white"
              unchecked-icon="img:src/assets/lokacija-toggle-ikona.svg"
              size="lg"
              @click="toggleLocation"
            />
            <q-btn
              flat
              dense
              round
              icon="menu"
              aria-label="Menu"
              @click="drawerOpen = !drawerOpen"
            />
          </div>
          <div class="nice-text" v-else>
            <q-toggle
              v-model="Lokacija"
              class="q-ml-xl"
              checked-icon="img:src/assets/lokacija-toggle-ikona.svg"
              color="white"
              unchecked-icon="img:src/assets/lokacija-toggle-ikona.svg"
              size="lg"
              @click="toggleLocation"
            />
            <q-btn flat label="Početna" to="/" class="q-btn-standard" />
            <q-btn flat label="Objave" to="/objave" class="q-btn-standard" />
            <q-btn flat label="O nama" to="/o_nama" class="q-btn-standard" />

            <q-btn
              v-if="this.user === null"
              flat
              label="Prijava"
              to="/prijava"
              class="q-btn-standard"
            />
            <q-btn
              v-if="this.user === null"
              flat
              label="Registracija"
              to="/registracija"
              class="q-btn-standard"
            />
            <q-btn flat class="q-btn-standard" to="/profil" v-else>
              {{ user.displayName }}</q-btn
            >
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      side="right"
      overlay
      behavior="mobile"
      content-class="bg-white"
      :mini="true"
      :width="200"
    >
      <div class="drawer-buttons nice-text-mobile">
        <q-btn flat label="Početna" to="/" class="q-btn-standard" />
        <q-btn flat label="Objave" to="/objave" class="q-btn-standard" />
        <q-btn flat label="O nama" to="/o_nama" class="q-btn-standard" />

        <q-btn
          v-if="this.user === null"
          flat
          label="Prijava"
          to="/prijava"
          class="q-btn-standard"
        />
        <q-btn
          v-if="this.user === null"
          flat
          label="Registracija"
          to="/registracija"
          class="q-btn-standard"
        />
        <q-btn flat class="q-btn-standard" to="/profil" v-else>
          {{ user.displayName }}</q-btn
        >
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";
import { auth } from "src/boot/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { setLokacijaEnabled, clearGlobals } from "/utils/globals";
export default defineComponent({
  name: "MainLayout",

  data() {
    return {
      Lokacija: false,
      drawerOpen: false,
      user: auth.currentUser,
    };
  },

  computed: {
    isMobile() {
      return this.$q.platform.is.mobile;
    },
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
    });
    console.log("Lokacija: ", this.Lokacija);
  },
  methods: {
    toggleLocation() {
      setLokacijaEnabled(this.Lokacija);
      console.log(this.Lokacija);
      if (!this.Lokacija) {
        clearGlobals();
      }
    },
  },
});
</script>

<style scoped>
.q-pa-md {
  padding: var(--q-space-md);
}
.q-gutter-y-sm {
  --q-gutter-y: var(--q-space-sm);
}
.q-gutter-x-sm {
  --q-gutter-x: var(--q-space-sm);
}
.q-ml-auto {
  margin-left: auto;
}
.drawer-buttons {
  display: flex;
  flex-direction: column;
}
.nice-text {
  font-family: "Montserrat", sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.4;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.nice-text-mobile {
  font-family: "Montserrat", sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.image {
  width: 7vh;
  object-fit: contain;
}
.image-mobile {
  width: 4vh;
  object-fit: contain;
}
</style>
