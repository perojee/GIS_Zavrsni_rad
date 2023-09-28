<template>
  <q-page>
    <div class="row">
      <div class="col q-ml-lg q-mt-lg">
        <template v-if="isLoading">
          <p>Učitavanje...</p>
        </template>
        <template v-else>
          <div v-if="!userEmailVerified" class="email-verification">
            Molimo potvrdite svoju e-mail adresu (provjerite bezvrijedu poštu)
          </div>
          <div class="column-container">
            <div class="left-column">
              <p class="text-content">Korisničko ime:</p>
              <p class="text-under">{{ username }}</p>
              <p class="text-content">Kontakt:</p>

              <div class="label-container">
                <p class="label">Email:</p>
                <p class="text-under">{{ email }}</p>
              </div>
              <div class="contact-info">
                <div class="label-container">
                  <p class="label">Broj:</p>
                  <p v-if="!isEditing" class="text-under">{{ phoneNumber }}</p>

                  <div v-if="isEditing" class="input-container">
                    <q-input v-model="editedPhoneNumber" filled class="input" />
                    <div class="buttons">
                      <img
                        src="src/assets/check.png"
                        class="image"
                        @click="savePhoneNumber"
                      />
                    </div>
                    <div class="buttons">
                      <img
                        class="image"
                        src="src/assets/delete-button.png"
                        @click="cancelEditing"
                      />
                    </div>
                  </div>
                  <div v-if="!isEditing" class="contact-image">
                    <img
                      src="src/assets/pen.png"
                      class="image"
                      alt=""
                      @click="startEditing"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!isMobile" class="right-column">
              <p class="text-postavke" @click="openPostavkeModal">
                Postavke privatnosti
              </p>
              <p class="text-postavke" @click="openModal">Izmjena lozinke</p>
              <p class="text-postavke" v-if="isAdmin" @click="redirectAdmin">
                Admin postavke
              </p>
              <q-btn class="" color="blue" @click="signOutUser"> Odjava </q-btn>
            </div>
          </div>

          <div class="q-mt-lg"></div>
          <div v-if="isMobile" class="right-column">
            <p class="text-postavke-mobile" @click="openPostavkeModal">
              Postavke privatnosti
            </p>
            <p class="text-postavke-mobile" @click="openModal">
              Izmjena lozinke
            </p>
            <p
              class="text-postavke-mobile"
              v-if="isAdmin"
              @click="redirectAdmin"
            >
              Admin postavke
            </p>
            <q-btn class="" color="blue" @click="signOutUser"> Odjava </q-btn>
            <div class="q-mb-lg"></div>
          </div>
        </template>
      </div>
    </div>
    <div
      style="
        font-size: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
      "
    >
      Moje objave
    </div>
    <div
      v-if="!postsExist"
      style="
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        margin-bottom: 10px;
        font-style: italic;
      "
    >
      Trenutno nemate aktivnih objava...
    </div>
    <div v-else>
      <div class="card" v-for="post in activePosts" :key="post.id">
        <p><strong>Korisnik: </strong>{{ post.username }}</p>
        <p><strong>Tip: </strong>{{ post.Type }}</p>
        <p><strong>Komentar: </strong>{{ post.komentar }}</p>
        <p><strong>Broj: </strong>{{ post.phoneNumber }}</p>
        <p><strong>Vrijeme: </strong>{{ formatTimestamp(post.timestamp) }}</p>

        <div class="button-kontainer">
          <q-btn
            push
            class="button-style"
            @click="deletePost(post.id)"
            color="red"
            >Izbriši</q-btn
          >
          <q-btn
            push
            class="button-style"
            @click="toggleEdit(post.id)"
            color="blue"
            style="margin-left: 15px"
            >Uredi</q-btn
          >
        </div>
        <div v-if="editingPostId === post.id">
          <q-select
            v-model="editedPostData.username"
            label="Korisnik"
            :options="usernameOptions"
          />
          <q-select
            v-model="editedPostData.Type"
            label="Tip"
            :options="typeOptions"
          />
          <q-input v-model="editedPostData.komentar" label="Komentar" />
          <q-input v-model="editedPostData.broj" label="Broj" />
          <q-btn
            push
            style="margin: 10px 0 0 5px"
            color="green"
            @click="saveEditedPost(post.id)"
            label="Spremi"
          />
        </div>
      </div>
    </div>
    <div v-if="showModal">
      <PasswordModal
        :showModal="showModal"
        @update:showModal="showModal = $event"
      />
    </div>
    <div v-if="showPostavkeModal">
      <PostavkeModal
        :showPostavkeModal="showPostavkeModal"
        @update:showPostavkeModal="showPostavkeModal = $event"
      />
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import { auth, db } from "src/boot/firebase.js";
import { signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import PasswordModal from "components/PasswordResetModal.vue";
import PostavkeModal from "components/PostavkeModal.vue";
export default {
  components: {
    PasswordModal,
    PostavkeModal,
  },
  setup() {
    const $q = useQuasar();
    const router = useRouter();

    const isLoading = ref(true);
    const isEditing = ref(false);
    const editedPhoneNumber = ref("");
    const isMobile = ref(false);
    const activePosts = ref([]);
    const postsExist = ref(false);

    const username = ref(null);
    const email = ref(null);
    const phoneNumber = ref(null);
    const showModal = ref(false);
    const showPostavkeModal = ref(false);
    const isAdmin = ref(false);

    const userEmailVerified = ref(false);

    const editingPostId = ref(null);
    const editedPostData = ref({
      username: "",
      Type: "",
      komentar: "",
      broj: "",
    });

    const usernameOptions = ref(["Anonimno"]);
    const typeOptions = ref(["Nudim pomoć", "Tražim pomoć"]);

    const openModal = () => {
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const openPostavkeModal = () => {
      showPostavkeModal.value = true;
    };

    const closePostavkeModal = () => {
      showPostavkeModal.value = false;
    };

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          username.value = user.displayName;
          email.value = user.email;

          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getDoc(userDocRef);

          if (user.emailVerified) {
            userEmailVerified.value = true;
          }
          usernameOptions.value.push(user.displayName);
          if (userDocSnapshot.exists()) {
            phoneNumber.value = userDocSnapshot.data().phoneNumber;
            if (userDocSnapshot.data().role == "admin") {
              isAdmin.value = true;
            }
          } else {
            phoneNumber.value = "Korisnik nije pohranio broj";
            console.log("User document does not exist");
          }
        } catch (error) {
          console.log(error);
        } finally {
          isLoading.value = false;
        }
      } else {
        redirectIndex();
      }
    };

    const checkIsMobile = () => {
      isMobile.value = $q.platform.is.mobile;
    };

    onMounted(() => {
      fetchUserData();
      checkIsMobile();
      fetchPosts();
    });

    const redirectIndex = () => {
      router.push({ name: "IndexPage" });
    };

    const redirectAdmin = () => {
      router.push({ name: "AdminPage" });
    };

    const signOutUser = async () => {
      try {
        signOut(auth);
        $q.notify({
          message: "Uspješno odjavljeni",
          type: "positive",
        });
        redirectIndex();
      } catch (error) {
        console.log(error);
      }
    };

    const startEditing = () => {
      editedPhoneNumber.value = phoneNumber.value;
      isEditing.value = true;
    };

    const cancelEditing = () => {
      isEditing.value = false;
    };

    const savePhoneNumber = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { phoneNumber: editedPhoneNumber.value });

        phoneNumber.value = editedPhoneNumber.value;
        isEditing.value = false;

        $q.notify({
          message: "Broj telefona je ažuriran.",
          type: "positive",
        });
      } catch (error) {
        console.log(error);
      }
    };

    async function fetchPosts() {
      try {
        const user = auth.currentUser;
        const postsCollectionRef = collection(db, "posts");
        const statusQuery = query(
          postsCollectionRef,
          where("status", "==", "active"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(statusQuery);

        activePosts.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (activePosts.value.length > 0) {
          postsExist.value = true;
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }

    const toggleEdit = (postId) => {
      if (editingPostId.value === postId) {
        editingPostId.value = null;
      } else {
        editingPostId.value = postId;
        const post = activePosts.value.find((p) => p.id === postId);
        if (post) {
          editedPostData.value.username = post.username;
          editedPostData.value.Type = post.Type;
          editedPostData.value.komentar = post.komentar;
          editedPostData.value.broj = post.phoneNumber;
        }
      }
    };

    const saveEditedPost = async (postId) => {
      try {
        const post = activePosts.value.find((p) => p.id === postId);
        if (!post) return; // Post not found

        post.username = editedPostData.value.username;
        post.Type = editedPostData.value.Type;
        post.komentar = editedPostData.value.komentar;
        post.phoneNumber = editedPostData.value.broj;

        const postDocRef = doc(db, "posts", postId);
        await updateDoc(postDocRef, {
          username: editedPostData.value.username,
          Type: editedPostData.value.Type,
          komentar: editedPostData.value.komentar,
          phoneNumber: editedPostData.value.broj,
        });

        editingPostId.value = null;
        $q.notify({
          message: "Objava uspješno ažurirana.",
          type: "positive",
        });
      } catch (error) {
        console.error("Error updating post:", error);
      }
    };

    watch(activePosts, () => {
      editingPostId.value = null;
    });

    const deletePost = async (postId) => {
      try {
        const confirmDelete = window.confirm(
          "Da li ste sigurni da želite obrisati ovu objavu?"
        );

        if (confirmDelete) {
          // Delete the post from the database
          const postDocRef = doc(db, "posts", postId);
          await deleteDoc(postDocRef);

          // Remove the post from the activePosts array
          const index = activePosts.value.findIndex(
            (post) => post.id === postId
          );
          if (index !== -1) {
            activePosts.value.splice(index, 1);
          }

          $q.notify({
            message: "Objava uspješno obrisana.",
            type: "positive",
          });
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    };

    return {
      username,
      email,
      phoneNumber,
      isLoading,
      isMobile,
      signOutUser,
      startEditing,
      isEditing,
      checkIsMobile,
      editedPhoneNumber,
      cancelEditing,
      savePhoneNumber,
      redirectIndex,
      showModal,
      openModal,
      closeModal,
      isAdmin,
      redirectAdmin,
      userEmailVerified,
      showPostavkeModal,
      openPostavkeModal,
      closePostavkeModal,
      activePosts,
      postsExist,
      editingPostId,
      editedPostData,
      toggleEdit,
      saveEditedPost,
      usernameOptions,
      typeOptions,
      deletePost,
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
  },
};
</script>

<style scoped>
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

.contact-info {
  display: flex;
  align-items: center;
}

.contact-image {
  margin-left: 10px;
}

.input-container {
  display: flex;
  align-items: center;
}
.column-container {
  display: flex;
  justify-content: space-between;
}

.left-column {
  width: 100%;
}
.text-postavke {
  color: #19007b;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
}
.text-postavke:hover {
  color: #038872;
  cursor: pointer;
}
.text-postavke-mobile {
  color: #19007b;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
  white-space: nowrap;
}
.text-postavke-mobile:hover {
  color: #038872;
  cursor: pointer;
}
.right-column {
  width: 20%;
}
.buttons {
  margin-left: 15px;
}
.image {
  border-radius: 50%;
  width: 25px;
  height: 25px;
  object-fit: cover;
  cursor: pointer;
}
.email-verification {
  margin: 0 5px 0;
  margin-bottom: 30px;
  color: red;
}
.label-container {
  display: flex;
  align-items: center;
}

.label {
  margin: 0 5px 0;
  padding: 0;
  font-size: 15px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
.card {
  margin: 10px 10px 5px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background-color: #fff;
  display: flex;
  flex-direction: column;
}
</style>
