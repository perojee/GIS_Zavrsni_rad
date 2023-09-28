<template>
  <q-form @submit.prevent="registerUser">
    <label for="username"
      >Korisničko ime:
      <div class="dot">*</div>

      <q-input
        filled
        class="input"
        type="text"
        autocomplete="username"
        :rules="[
          (val) => (val && val.length > 0) || 'Molimo upišite korisničko ime',
        ]"
        v-model="username"
      />
    </label>
    <label for="email"
      >Email:
      <div class="dot">*</div></label
    >
    <q-input
      filled
      class="input"
      type="email"
      :rules="[(val) => /@/.test(val) || 'Molimo upišite ispravan email']"
      v-model="email"
    />
    <label>Broj:</label>
    <q-input class="input" filled v-model="broj" type="number" />
    <label
      >Lozinka:
      <div class="dot">*</div></label
    >
    <q-input
      class="input"
      filled
      type="password"
      v-model="password"
      :rules="[
        (val) =>
          (val && val.length >= 0) ||
          'Lozinka mora sadržavati minimalno 8 znakova',
      ]"
    />

    <label
      >Potvrdite lozinku:
      <div class="dot">*</div></label
    >
    <q-input class="input" filled type="password" v-model="passwordConfirm" />
    <div>Nastavite sa google računom:</div>
    <q-btn
      square
      color="white"
      icon="img:src/assets/google.jpg"
      @click="signInWithGoogle"
    />
    <div class="links">
      <p class="link" @click="redirectLogin">Već registrirani? Prijavi se</p>
    </div>
    <div class="submit">
      <q-btn
        name="submit"
        type="submit"
        @keyup.enter="registerUser"
        @click="registerUser"
        >Registracija</q-btn
      >
    </div>
  </q-form>
</template>

<script>
import { useQuasar } from "quasar";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "src/boot/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
export default {
  setup() {
    const $q = useQuasar();
    const router = useRouter();

    const username = ref("");
    const broj = ref("");
    const email = ref("");
    const password = ref("");
    const passwordConfirm = ref("");

    const isLoggedIn = () => {
      const user = auth.currentUser;
      if (user) {
        redirectIndex();
      }
    };

    const registerUser = async () => {
      try {
        const userEmail = email.value;
        const userPassword = password.value;
        const checkPassword = passwordConfirm.value;
        const userBroj = broj.value;
        const userUsername = username.value;

        const userQuery = query(
          collection(db, "users"),
          where("username", "==", userUsername)
        );

        const emailQuery = query(
          collection(db, "users"),
          where("email", "==", userEmail)
        );

        const querySnapshotEmail = await getDocs(emailQuery);
        if (!querySnapshotEmail.empty) {
          $q.notify({
            message: "E-mail je već registriran.",
            type: "negative",
          });
          return;
        }

        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          $q.notify({
            message:
              "Korisničko ime već postoji, molimo odaberite drugo korsiničko ime.",
            type: "negative",
          });
          return;
        }
        if (!(userPassword === checkPassword)) {
          $q.notify({
            message: "Lozinke se ne podudaraju.",
            type: "negative",
          });
          return;
        }
        if (!(userPassword.length >= 8)) {
          $q.notify({
            message: "Lozinka mora sadržavati minimalno 8 znakova.",
            type: "negative",
          });
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userEmail,
          userPassword
        );

        await updateProfile(userCredential.user, {
          displayName: userUsername,
          phoneNumber: userBroj,
        });

        const user = userCredential.user;
        user.phoneNumber = userBroj;

        const userDocRef = doc(
          collection(db, "users"),
          userCredential.user.uid
        );
        await setDoc(userDocRef, {
          username: userUsername,
          email: userEmail,
          phoneNumber: userBroj,
          role: "user",
          usernameVisible: true,
          emailVisible: true,
          numberVisible: true,
        });

        await sendEmailVerification(userCredential.user);
        $q.notify({
          message:
            "Molimo potvrdite svoj e-mail prateći link poslan na vašu adresu",
          icon: "announcement",
        });

        redirectIndex();
      } catch (error) {
        console.log(error);
      }
    };

    const redirectLogin = () => {
      router.push({ name: "PrijavaPage" });
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
    onMounted(() => {
      isLoggedIn();
    });
    return {
      username,
      broj,
      email,
      password,
      passwordConfirm,
      redirectLogin,
      registerUser,
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
  margin: 35px 0 0;
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
p {
  display: inline-block;
}
</style>
