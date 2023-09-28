<template>
  <q-page>
    <div>
      <form>
        <label>Email: </label>
        <q-input
          filled
          class="input"
          type="email"
          :rules="[(val) => /@/.test(val) || 'Molimo upišite ispravan email']"
          v-model="email"
        />

        <label>Lozinka: </label>
        <q-input class="input" filled type="password" v-model="password" />
        <div>Nastavite sa google računom:</div>
        <q-btn
          square
          color="white"
          icon="img:src/assets/google.jpg"
          @click="signInWithGoogle"
        />
        <div class="links">
          <p
            class="link"
            style="display: inline-block"
            @click="redirectRegister"
          >
            Novi korisnik? Registriraj se!
          </p>
        </div>
        <div class="links">
          <p class="link" style="display: inline-block" @click="openModal">
            Zaboravili ste lozinku?
          </p>
        </div>
        <div class="submit">
          <q-btn @click="signUserIn" @keyup.enter="signUserIn">Prijava</q-btn>
        </div>
      </form>
    </div>
    <div v-if="showModal">
      <PasswordModal
        :showModal="showModal"
        @update:showModal="showModal = $event"
      />
    </div>
  </q-page>
</template>

<script>
import { useQuasar } from "quasar";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
} from "firebase/auth";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "src/boot/firebase.js";
import PasswordModal from "components/PasswordResetModal.vue";

export default {
  components: {
    PasswordModal,
  },
  setup() {
    const $q = useQuasar();
    const router = useRouter();

    const email = ref("");
    const password = ref("");

    const showModal = ref(false);

    const isLoggedIn = () => {
      const user = auth.currentUser;
      if (user) {
        redirectIndex();
      }
    };

    const openModal = () => {
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const redirectRegister = () => {
      router.push({ name: "RegistracijaPage" });
    };

    const redirectIndex = () => {
      router.push({ name: "IndexPage" });
    };

    async function signInWithGoogle() {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      try {
        const result = await signInWithPopup(auth, provider);
        const userDocRef = doc(collection(db, "users"), result.user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (!docSnapshot.exists()) {
          await setDoc(userDocRef, {
            username: result.user.displayName,
            email: result.user.email,
            phoneNumber: null,
            role: "user",
            usernameVisible: true,
            emailVisible: true,
            numberVisible: false,
          });
        }

        $q.notify({
          message: "Uspješno prijavljeni",
          type: "positive",
        });
        redirectIndex();
      } catch (error) {
        console.error("Error signing in with Google:", error);
      }
    }

    const signUserIn = async () => {
      try {
        const userEmail = email.value;
        const userPassword = password.value;

        await signInWithEmailAndPassword(auth, userEmail, userPassword);
        $q.notify({
          message: "Uspješno prijavljeni",
          type: "positive",
        });
        redirectIndex();
      } catch (error) {
        console.log(error);
        $q.notify({
          message: "Neispravan e-mail ili lozinka",
          type: "negative",
        });
        return;
      }
    };

    onMounted(() => {
      isLoggedIn();
    });

    return {
      password,
      email,
      showModal,
      redirectRegister,
      signUserIn,
      redirectIndex,
      openModal,
      closeModal,
      signInWithGoogle,
      isLoggedIn,
    };
  },
};
</script>

<style scoped>
form {
  max-width: 420px;
  margin: 20px auto;
  background: white;
  text-align: left;
  padding: 40px;
  border-radius: 10px;
}
label {
  color: #1976d2;
  display: inline-block;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  margin-bottom: 10px;
}

button {
  background: #0b6dff;
  border: 0;
  padding: 10px 20px;
  margin-top: 30px;
  color: white;
  border-radius: 20px;
}
.submit {
  text-align: center;
}
.links {
  margin: 20px 0 0;
  font-size: 12px;
  color: #0a0090;
}
.link:hover {
  cursor: pointer;
  color: #26a69a;
}
.select {
  width: 100%;
  color: #000000;
  text-transform: none;
}
.input {
  width: 100%;
  color: #000000;
  text-transform: none;
}
.dot {
  display: inline;
  color: red;
}
</style>
