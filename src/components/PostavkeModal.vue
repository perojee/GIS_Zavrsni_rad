<template>
  <div class="modal-postavke" @click.self="cancelResetPostavke">
    <div class="modal-content-postavke">
      <q-card>
        <div class="container">
          <div class="text">Vidljivost informacija nakon objave:</div>
          <div class="label-text">Korisničko ime:</div>
          <q-toggle v-model="usernameVisible"></q-toggle>
          <div class="label-text">E-mail:</div>
          <q-toggle v-model="emailVisible"></q-toggle>
          <div class="label-text">Telefonski broj:</div>
          <q-toggle v-model="numberVisible"></q-toggle>
          <div class="alert-text">
            Preporučujemo ostaviti barem jedan način kontakta.
          </div>
        </div>
        <q-card-actions class="q-card-actions-right">
          <q-btn label="Natrag" color="primary" @click="cancelResetPostavke" />
          <q-btn label="Sačuvaj" color="primary" @click="updateUserDocument" />
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, onMounted } from "vue";
import { auth, db } from "src/boot/firebase.js";
import { useQuasar } from "quasar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
export default defineComponent({
  name: "PasswordModal",
  props: {
    showPostavkeModal: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();

    const usernameVisible = ref(false);
    const emailVisible = ref(false);
    const numberVisible = ref(false);

    const user = auth.currentUser;

    const userDocRef = doc(db, "users", user.uid);

    const cancelResetPostavke = () => {
      emit("update:showPostavkeModal", false);
    };

    const cancelOutsideClick = (event) => {
      if (event.target.classList.contains("modal-postavke")) {
        cancelResetPostavke();
      }
    };

    onMounted(async () => {
      try {
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.data();

        if (userData) {
          usernameVisible.value = userData.usernameVisible;
          emailVisible.value = userData.emailVisible;
          numberVisible.value = userData.numberVisible;
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
      }
    });

    const updateUserDocument = async () => {
      const updateData = {
        usernameVisible: usernameVisible.value,
        emailVisible: emailVisible.value,
        numberVisible: numberVisible.value,
      };

      try {
        await updateDoc(userDocRef, updateData);
        $q.notify({
          message: "Postavke uspješno sačuvane",
          type: "positive",
        });
        cancelResetPostavke();
      } catch (error) {
        console.error("Error updating user document:", error);
      }
    };

    return {
      cancelOutsideClick,
      usernameVisible,
      emailVisible,
      numberVisible,
      updateUserDocument,
      cancelResetPostavke,
    };
  },
});
</script>

<style scoped>
/* CSS to style the modal */
.modal-postavke {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content-postavke {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  width: 100%;
}
.text {
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
.label-text {
  margin: 10px 5px 10px;
  padding: 0;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #1976d2;
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
.container {
  padding: 15px;
}
.alert-text {
  margin-top: 10px;
  font-size: 14px;
  font-style: italic;
  color: rgb(200, 9, 9);
}
</style>
