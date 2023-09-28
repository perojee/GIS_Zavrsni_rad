<template>
  <div class="fullscreen bg-dark text-white q-pa-md flex flex-center">
    <div>
      <div style="font-size: 15vh" title="404" class="glitch">404</div>

      <div class="text-h2" style="opacity: 0.4">Stranica ne postoji...</div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Natrag"
        no-caps
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "ErrorNotFound",
});
</script>
<style scoped>
.glitch {
  animation: glitch 1s linear infinite;
  display: flex;
}
@keyframes glitch {
  2%,
  64% {
    transform: translate(2px, 0) skew(0deg);
  }
  4%,
  60% {
    transform: translate(-2px, 0) skew(0deg);
  }
  62% {
    transform: translate(0, 0) skew(5deg);
  }
}
.glitch:before,
.glitch:after {
  content: attr(title);
  position: absolute;
  left: 0;
}
.glitch:before {
  animation: glitchTop 1s linear infinite;
  clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
}
@keyframes glitchTop {
  2%,
  64% {
    transform: translate(2px, -2px);
  }
  4%,
  60% {
    transform: translate(-2px, 2px);
  }
  62% {
    transform: translate(13px, -1px) skew(-13deg);
  }
}
.glitch:after {
  animation: glitchBottom 1.5s linear infinite;
  clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
}

@keyframes glitchBottom {
  2%,
  64% {
    transform: translate(-2px, 0);
  }

  4%,
  60% {
    transform: translate(-2px, 0);
  }
  62% {
    transform: translate(-22px, 5px) skew(21deg);
  }
}
</style>
