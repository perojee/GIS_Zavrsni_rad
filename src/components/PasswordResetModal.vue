<template>
  <div class="modal" @click.self="cancelReset">
    <div class="modal-content">
      <q-card>
        <q-card-section>
          <div>Promjena lozinke</div>
          <p>Upišite vašu e-mail adresu za promjenu lozinke</p>
          <q-input
            filled
            type="email"
            v-model="email"
            :rules="[
              (val) => /@/.test(val) || 'Molimo upište ispravnu e-mail adresu',
            ]"
          />
        </q-card-section>

        <q-card-actions class="q-card-actions-right">
          <q-btn label="Natrag" color="primary" @click="cancelReset" />
          <q-btn
            label="Promjeni lozinku"
            color="primary"
            @click="resetPassword"
          />
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent } from "vue";
import { auth } from "src/boot/firebase.js";
import { sendPasswordResetEmail } from "firebase/auth";
import { useQuasar } from "quasar";
export default defineComponent({
  name: "PasswordModal",
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { emit }) {
    const email = ref("");
    const $q = useQuasar();

    const user = auth.currentUser;

    const cancelReset = () => {
      emit("update:showModal", false);
    };

    const cancelOutsideClick = (event) => {
      if (event.target.classList.contains("modal")) {
        cancelReset();
      }
    };

    const resetPassword = async () => {
      try {
        if (!email.value.includes("@")) {
          $q.notify({
            message: "Molimo upišite ispravanu e-mail adresu",
            type: "negative",
          });
          return;
        }

        await sendPasswordResetEmail(auth, email.value);

        emit("update:showModal", false);

        $q.notify({
          message:
            "Zahtjev za promjenu loznike poslan! Molimo projerite svoju e-mail adresu",
          type: "positive",
        });
      } catch (error) {
        console.log(error);
        return;
      }
    };

    return {
      user,
      email,
      cancelReset,
      resetPassword,
      cancelOutsideClick,
    };
  },
});
</script>

<style scoped>
/* CSS to style the modal */
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
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  width: 100%;
}
</style>
